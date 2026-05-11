import VivaResult from "../../model/vivaResult.model.js";

const parseMetric = (text, metricName) => {
    const pattern = new RegExp(`${metricName}\\s*[:=-]?\\s*(\\d+(?:\\.\\d+)?)`, "i");
    const match = String(text || "").match(pattern);
    return match ? parseFloat(match[1]) : null;
};

const normalizeEvaluation = (evaluation) => {
    if (evaluation && typeof evaluation === "object" && !Array.isArray(evaluation)) {
        const relevance = Number(evaluation.Relevance ?? evaluation.relevance);
        const completeness = Number(evaluation.Completeness ?? evaluation.completeness);
        const accuracy = Number(evaluation.Accuracy ?? evaluation.accuracy);
        const depthOfKnowledge = Number(
            evaluation.DepthOfKnowledge ??
            evaluation.depthOfKnowledge ??
            evaluation["Depth of Knowledge"]
        );
        const totalAverageScore = Number(
            evaluation.TotalAverageScore ??
            evaluation.totalAverageScore ??
            evaluation.average
        );

        return {
            Relevance: Number.isFinite(relevance) ? relevance : null,
            Completeness: Number.isFinite(completeness) ? completeness : null,
            Accuracy: Number.isFinite(accuracy) ? accuracy : null,
            DepthOfKnowledge: Number.isFinite(depthOfKnowledge) ? depthOfKnowledge : null,
            TotalAverageScore: Number.isFinite(totalAverageScore) ? totalAverageScore : null,
            rawText: typeof evaluation.rawText === "string" ? evaluation.rawText : "",
        };
    }

    const text = String(evaluation || "");
    const relevance = parseMetric(text, "Relevance");
    const completeness = parseMetric(text, "Completeness");
    const accuracy = parseMetric(text, "Accuracy");
    const depthOfKnowledge = parseMetric(text, "Depth\\s*of\\s*Knowledge");

    let totalAverageScore = parseMetric(text, "Total\\s*Average\\s*Score\\s*\\(?out\\s*of\\s*10\\)?");

    if (!Number.isFinite(totalAverageScore)) {
        const available = [relevance, completeness, accuracy, depthOfKnowledge].filter((v) => Number.isFinite(v));
        totalAverageScore = available.length ? available.reduce((a, b) => a + b, 0) / available.length : null;
    }

    return {
        Relevance: Number.isFinite(relevance) ? relevance : null,
        Completeness: Number.isFinite(completeness) ? completeness : null,
        Accuracy: Number.isFinite(accuracy) ? accuracy : null,
        DepthOfKnowledge: Number.isFinite(depthOfKnowledge) ? depthOfKnowledge : null,
        TotalAverageScore: Number.isFinite(totalAverageScore) ? totalAverageScore : null,
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
            const hasScore = Number.isFinite(q?.evaluation?.TotalAverageScore);
            return answered || hasScore;
        });

        const attemptedCount = attemptedQuestions.length;
        let totalScore = 0;

        attemptedQuestions.forEach((question) => {
            if (Number.isFinite(question?.evaluation?.TotalAverageScore)) {
                totalScore += question.evaluation.TotalAverageScore;
            }
        });

        const finalScore = attemptedCount > 0 ? Number((totalScore / attemptedCount).toFixed(2)) : 0;
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
