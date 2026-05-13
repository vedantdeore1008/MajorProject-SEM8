import VivaResult from "../../model/vivaResult.model.js";

const parseMetric = (text, metricName) => {
    const str = String(text || "");
    // Try "MetricName (out of 10): X/10" format (detailed section)
    const slashRegex = new RegExp(`${metricName}[^:]*:\\s*(?:\\*\\*)?\\s*(\\d+(?:\\.\\d+)?)\\s*/\\s*10`, "gi");
    const slashMatches = [...str.matchAll(slashRegex)];
    if (slashMatches.length > 0) return Number(slashMatches[slashMatches.length - 1][1]);
    // Try "MetricName: X" - prefer LAST non-zero occurrence
    const regex = new RegExp(`${metricName}[^:]*[:=-]\\s*(?:\\*\\*)?\\s*(\\d+(?:\\.\\d+)?)`, "gi");
    const matches = [...regex[Symbol.matchAll] ? str.matchAll(regex) : []];
    if (matches.length > 0) {
        const nonZero = matches.filter(m => Number(m[1]) > 0);
        if (nonZero.length > 0) return Number(nonZero[nonZero.length - 1][1]);
        return Number(matches[matches.length - 1][1]);
    }
    return null;
};

const normalizeEvaluation = (evaluation) => {
    if (evaluation && typeof evaluation === "object" && !Array.isArray(evaluation)) {
        const relevance = Number(evaluation.Relevance ?? evaluation.relevance ?? 0);
        const completeness = Number(evaluation.Completeness ?? evaluation.completeness ?? 0);
        const accuracy = Number(evaluation.Accuracy ?? evaluation.accuracy ?? 0);
        const depthOfKnowledge = Number(
            evaluation.DepthOfKnowledge ?? evaluation.depthOfKnowledge ?? evaluation["Depth of Knowledge"] ?? 0
        );
        let totalAverageScore = Number(
            evaluation.TotalAverageScore ?? evaluation.totalAverageScore ?? evaluation.average ?? 0
        );

        if (!totalAverageScore || totalAverageScore === 0) {
            const scores = [relevance, completeness, accuracy, depthOfKnowledge].filter(s => s > 0);
            if (scores.length > 0) totalAverageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        }

        return {
            Relevance: Number.isFinite(relevance) ? relevance : 0,
            Completeness: Number.isFinite(completeness) ? completeness : 0,
            Accuracy: Number.isFinite(accuracy) ? accuracy : 0,
            DepthOfKnowledge: Number.isFinite(depthOfKnowledge) ? depthOfKnowledge : 0,
            TotalAverageScore: Number.isFinite(totalAverageScore) ? totalAverageScore : 0,
            rawText: typeof evaluation.rawText === "string" ? evaluation.rawText : "",
        };
    }

    const text = String(evaluation || "");
    if (text.includes("No speech") || text.length < 5) {
        return { Relevance: 0, Completeness: 0, Accuracy: 0, DepthOfKnowledge: 0, TotalAverageScore: 0, rawText: text };
    }

    // Try parsing as JSON string
    try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === "object") return normalizeEvaluation(parsed);
    } catch {}

    const relevance = parseMetric(text, "Relevance");
    const completeness = parseMetric(text, "Completeness");
    const accuracy = parseMetric(text, "Accuracy");
    const depthOfKnowledge = parseMetric(text, "Depth\\s*(?:of\\s*)?Knowledge");
    let totalAverageScore = parseMetric(text, "Total\\s*Average\\s*(?:Score)?");

    // Try "X / 10" format at the end
    if (!Number.isFinite(totalAverageScore) || totalAverageScore === 0) {
        const totalMatch = text.match(/Total\s*Average\s*Score[^]*?(\d+(?:\.\d+)?)\s*\/\s*10/i);
        if (totalMatch && Number(totalMatch[1]) > 0) totalAverageScore = Number(totalMatch[1]);
    }

    if (!Number.isFinite(totalAverageScore) || totalAverageScore === 0) {
        const available = [relevance, completeness, accuracy, depthOfKnowledge].filter((v) => Number.isFinite(v) && v > 0);
        totalAverageScore = available.length ? available.reduce((a, b) => a + b, 0) / available.length : 0;
    }

    return {
        Relevance: Number.isFinite(relevance) ? relevance : 0,
        Completeness: Number.isFinite(completeness) ? completeness : 0,
        Accuracy: Number.isFinite(accuracy) ? accuracy : 0,
        DepthOfKnowledge: Number.isFinite(depthOfKnowledge) ? depthOfKnowledge : 0,
        TotalAverageScore: Number.isFinite(totalAverageScore) ? totalAverageScore : 0,
        rawText: text,
    };
};

export const addVivaResult = async (req, res) => {
    try {
        const { vivaId, studentId, studentName, totalQuestions, questionAnswerSet, dateOfViva, proctoredFeedback } = req.body;

        console.log("[vivaresult/addvivaresult] incoming", {
            vivaId,
            studentId,
            studentName,
            totalQuestions,
            questionAnswerSetCount: Array.isArray(questionAnswerSet) ? questionAnswerSet.length : null,
            hasProctoredFeedback: !!proctoredFeedback,
        });

        if (!vivaId || !studentId || !studentName) {
            return res.status(400).json({ message: "Missing required fields", success: false });
        }

        const safeQuestionAnswerSet = Array.isArray(questionAnswerSet) ? questionAnswerSet : [];

        const normalizedQuestionAnswerSet = safeQuestionAnswerSet.map((question) => ({
            questionText: question?.questionText || "",
            modelAnswer: question?.modelAnswer || "",
            studentAnswer: question?.studentAnswer || "",
            evaluation: normalizeEvaluation(question?.evaluation),
        }));

        const attemptedQuestions = normalizedQuestionAnswerSet.filter((q) => {
            const answered = typeof q.studentAnswer === "string" && q.studentAnswer.trim().length > 0 && !q.studentAnswer.trim().startsWith("ERROR:");
            const hasScore = Number.isFinite(q?.evaluation?.TotalAverageScore) && q.evaluation.TotalAverageScore > 0;
            return answered || hasScore;
        });

        const attemptedCount = attemptedQuestions.length;
        let totalScore = 0;

        attemptedQuestions.forEach((question) => {
            if (Number.isFinite(question?.evaluation?.TotalAverageScore)) {
                totalScore += question.evaluation.TotalAverageScore;
            }
        });

        // Penalty: divide by total questions (not just attempted) — unattempted questions count as 0
        const totalQ = Number(totalQuestions || safeQuestionAnswerSet.length || attemptedCount || 1);
        const finalScore = totalScore > 0 ? Number((totalScore / Math.max(totalQ, attemptedCount)).toFixed(2)) : 0;
        const safeProctoredFeedback = {
            phoneDetectedCount: Number(proctoredFeedback?.phoneDetectedCount || 0),
            laptopDetectedCount: Number(proctoredFeedback?.laptopDetectedCount || 0),
            bookDetectedCount: Number(proctoredFeedback?.bookDetectedCount || 0),
            multipleUsersDetectedCount: Number(proctoredFeedback?.multipleUsersDetectedCount || 0),
            tabSwitchingDetectedCount: Number(proctoredFeedback?.tabSwitchingDetectedCount || 0),
        };

        console.log("[vivaresult/addvivaresult] computed", {
            normalizedCount: normalizedQuestionAnswerSet.length,
            attemptedCount,
            finalScore,
            proctoredFeedback: safeProctoredFeedback,
        });
        
        const savedVivaResult = await VivaResult.findOneAndUpdate(
            { vivaId, studentId },
            {
                $set: {
                    vivaId,
                    studentId,
                    studentName,
                    totalQuestions: Number(totalQuestions || safeQuestionAnswerSet.length || 0),
                    questionAnswerSet: normalizedQuestionAnswerSet,
                    dateOfViva,
                    overallMark: finalScore,
                    proctoredFeedback: safeProctoredFeedback,
                },
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        );
        console.log("[vivaresult/addvivaresult] saved", {
            id: savedVivaResult?._id,
            vivaId: savedVivaResult?.vivaId,
            studentId: savedVivaResult?.studentId,
            questionAnswerSetCount: savedVivaResult?.questionAnswerSet?.length,
            overallMark: savedVivaResult?.overallMark,
        });
        res.status(201).json({
            message: "Viva result saved successfully",
            data: savedVivaResult,
            success: true
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: error.message || "Server Error" });
    }
};
