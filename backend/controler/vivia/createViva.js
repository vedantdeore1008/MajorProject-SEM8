import Viva from "../../model/viva.model.js";
export const  createViva=async(req,res)=>{
    console.log(req.body);
    try {
                const {classid,vivaname,timeofthinking,numberOfQuestionsToAsk,duedate,questionAnswerSet}=req.body;
                const sanitizedQuestionSet = Array.isArray(questionAnswerSet)
                    ? questionAnswerSet
                            .map((q) => ({
                                questionText: String(q?.questionText || "").trim(),
                                answer: String(q?.answer || "").trim(),
                                difficulty: ["easy", "medium", "hard"].includes(String(q?.difficulty || "").toLowerCase())
                                    ? String(q.difficulty).toLowerCase()
                                    : "medium",
                            }))
                            .filter((q) => q.questionText && q.answer)
                    : [];

                if (sanitizedQuestionSet.length === 0) {
                    return res.status(400).json({
                        message: "questionAnswerSet cannot be empty",
                        succes: false,
                    });
                }

        const newViva=await new Viva({
            classid,
            vivaname,
                        numberOfQuestionsToAsk: Number(numberOfQuestionsToAsk) || sanitizedQuestionSet.length,
            timeofthinking,
            duedate,
                        questionAnswerSet: sanitizedQuestionSet
        });
        await newViva.save();
        return res.status(201).json({
            message:"Viva created successfully",
            data:newViva,
            succes:true
        });
    } catch (error) {
        console.log("Error:",error);
        return res.status(500).json({ message: error.message || error });
    }
}