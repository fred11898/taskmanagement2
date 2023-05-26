const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema ({
    difficult: {
        type: String
    },
    priority: {
        type: String
    },
    difficult_status: {
        type: String,
        enum: ["Pending", "Done"],
        default: "Pending"
    },
    priority_status:{
        type: String,
        enum: ["Pending", "Done"],
        default: "Pending"
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Employee"
    },
},{timestamps: true});

module.exports = mongoose.model("Task", taskSchema);