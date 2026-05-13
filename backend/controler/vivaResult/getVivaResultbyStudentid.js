import vivaresult from '../../model/vivaResult.model.js';

export const getVivaResultByStudentid = async (req, res) => {
    try {
        const { studentId } = req.params;

        const vivaResult = await vivaresult
            .find({ studentId })
            .sort({ dateOfViva: -1, _id: -1 })
            .populate('vivaId');

        res.status(200).json(vivaResult || []);
    } catch (error) {
        console.error("Error fetching viva results:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};