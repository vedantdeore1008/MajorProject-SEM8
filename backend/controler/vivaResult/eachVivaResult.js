import mongoose from "mongoose";
import VivaResult from "../../model/vivaResult.model.js";

export const getVivaResultByVivaId = async (req, res) => {
    try {
        const { vivaid } = req.params;  // Extract vivaId from URL
        console.log("Received Viva ID:", vivaid);

        // If vivaId is stored as an ObjectId, convert it
        const query = mongoose.Types.ObjectId.isValid(vivaid) 
            ? { vivaId: new mongoose.Types.ObjectId(vivaid) } 
            : { vivaId: vivaid };

        const vivaResults = await VivaResult.aggregate([
            { $match: query },
            { $sort: { dateOfViva: -1, _id: -1 } },
            {
                $group: {
                    _id: "$studentId",
                    doc: { $first: "$$ROOT" },
                },
            },
            { $replaceRoot: { newRoot: "$doc" } },
            { $sort: { dateOfViva: -1, _id: -1 } },
        ]);

        console.log("[vivaresult/getvivaresult] found", {
            vivaid,
            count: Array.isArray(vivaResults) ? vivaResults.length : null,
        });

        if (!vivaResults || vivaResults.length === 0) {
            return res.status(404).json({ 
                message: "No results found for this Viva", 
                success: false 
            });
        }

        res.status(200).json({
            message: "Viva results retrieved successfully",
            data: vivaResults,
            success: true
        });
    } catch (error) {
        console.error("Error fetching viva results:", error);
        res.status(500).json({ 
            message: error.message || "Server Error", 
            success: false 
        });
    }
};
