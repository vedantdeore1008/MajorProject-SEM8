import Class from "../../model/class.model.js";
import Viva from "../../model/viva.model.js";
import VivaResult from "../../model/vivaResult.model.js";

export const getTeacherDashboard = async (req, res) => {
  const { teacherId } = req.params;
  try {
    const classes = await Class.find({ teacher: teacherId })
      .populate("students", "name email profile_pic")
      .select("name subject students createdAt");

    if (!classes || classes.length === 0) {
      return res.status(200).json({
        classes: [],
        totalStudents: 0,
        vivas: [],
        recentResults: [],
        stats: { totalClasses: 0, totalVivas: 0, totalStudents: 0, avgScore: 0 },
      });
    }

    const classIds = classes.map((cls) => cls._id.toString());
    const totalStudents = classes.reduce((sum, cls) => sum + cls.students.length, 0);

    const vivas = await Viva.find({ classid: { $in: classIds } })
      .sort({ createdAt: -1 })
      .select("vivaname classid duedate status numberOfQuestionsToAsk timeofthinking createdAt");

    const vivaIds = vivas.map((v) => v._id);

    const recentResults = await VivaResult.find({ vivaId: { $in: vivaIds } })
      .sort({ dateOfViva: -1 })
      .limit(20)
      .populate("vivaId", "vivaname")
      .select("studentName overallMark totalQuestions dateOfViva vivaId proctoredFeedback");

    const allResults = await VivaResult.find({ vivaId: { $in: vivaIds } }).select("overallMark");
    const avgScore = allResults.length > 0
      ? (allResults.reduce((sum, r) => sum + (r.overallMark || 0), 0) / allResults.length).toFixed(1)
      : 0;

    const classNameMap = {};
    classes.forEach((cls) => {
      classNameMap[cls._id.toString()] = cls.name;
    });

    const vivasWithClass = vivas.map((v) => ({
      ...v.toObject(),
      className: classNameMap[v.classid] || "Unknown",
    }));

    res.status(200).json({
      classes: classes.map((c) => ({
        _id: c._id,
        name: c.name,
        subject: c.subject,
        studentCount: c.students.length,
        createdAt: c.createdAt,
      })),
      totalStudents,
      vivas: vivasWithClass,
      recentResults,
      stats: {
        totalClasses: classes.length,
        totalVivas: vivas.length,
        totalStudents,
        avgScore: parseFloat(avgScore),
        totalAttempts: allResults.length,
      },
    });
  } catch (error) {
    console.error("Error fetching teacher dashboard:", error);
    res.status(500).json({ message: "Failed to fetch teacher dashboard data." });
  }
};
