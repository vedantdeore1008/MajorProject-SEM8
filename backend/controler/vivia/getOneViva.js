
import Viva from "../../model/viva.model.js"; // Import your Viva model

export const getOneViva = async (req, res) => {
    try {
        const { vivaid } = req.params; // Get viva ID from request params
        const { studentId } = req.query;
        const viva = await Viva.findById(vivaid); // Fetch viva by ID

        if (!viva) {
            return res.status(404).json({
                 message: "Viva not found",
                 succes:false,
                });
        }

        const responsePayload = viva.toObject();

        if (studentId) {
            const submission = responsePayload.resumeSubmissions?.find(
                (item) => String(item?.studentId) === String(studentId)
            );

            if (submission?.preparedByTeacher && Array.isArray(submission.questionAnswerSet) && submission.questionAnswerSet.length > 0) {
                responsePayload.questionAnswerSet = submission.questionAnswerSet;
                responsePayload.numberOfQuestionsToAsk = submission.questionAnswerSet.length;
                responsePayload.isPersonalizedQuestionSet = true;
            } else {
                responsePayload.isPersonalizedQuestionSet = false;
            }

            responsePayload.studentResumeStatus = {
                uploaded: Boolean(submission),
                preparedByTeacher: Boolean(submission?.preparedByTeacher),
                questionCount: submission?.questionAnswerSet?.length || 0,
                resumeFileName: submission?.resumeFileName || "",
            };
        }

        res.status(200).json(responsePayload);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
