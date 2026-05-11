import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
    {
        questionText: { type: String, required: true },
        answer: { type: String, required: true },
        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            default: "medium",
        },
    },
    { _id: true }
);

const resumeSubmissionSchema = new mongoose.Schema(
    {
        studentId: { type: String, required: true },
        studentName: { type: String, default: "" },
        resumeUrl: { type: String, required: true },
        resumeFileName: { type: String, required: true },
        questionAnswerSet: {
            type: [questionSchema],
            default: [],
        },
        preparedByTeacher: { type: Boolean, default: false },
        uploadedAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    { _id: true }
);

const vivaSchema =mongoose.Schema({
    classid:{
        type:String,
    },
    vivaname:{
        type:String,
        required:[true,"provide name"]
    },
    timeofthinking:{
        type:Number,
        required:[true,"provide time"]
    },
    numberOfQuestionsToAsk:{
        type:Number,
        required:[true,"provide no of question"]
    },
    duedate:{
        type:Date,
        required:[true,"provide date"]
    },
    status: {
        type: Boolean,
        default: true, 
    },
    questionAnswerSet:{
        type:[questionSchema],
        default:[]
    },
    resumeSubmissions: {
        type: [resumeSubmissionSchema],
        default: [],
    }
},{ timestamps: true });

const Viva = mongoose.model("Viva",vivaSchema);
export default Viva;