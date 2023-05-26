require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const auth = require("./middlewares/auth");
const logger = require("./middlewares/logger");

// model
const User = require("./model/User");
const Employee = require("./model/Employee");
const Task = require("./model/Task");
const Department = require("./model/Department");

// Routes
const UserRoutes = require("./routes/userRoutes");
const authenticationRoutes = require("./routes/Authentication");

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.CONNECTION_STRING + process.env.DB_NAME, {useNewUrlParser: true});
const db = mongoose.connection;

db.on("error", (error) => console.log(error));
db.once("open", () => console.log("Database Connected ..."));

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use("/api", authenticationRoutes);

app.use(logger);


app.use(auth);

// ROUTES
app.use("/api/user", UserRoutes);
app.use("/api", authenticationRoutes);



// API for Employees

app.get("/api/employees", async (req, res) => {
    const employees = await Employee.find({})
    .populate("user")
    .populate("department")
    .sort({createdAt: -1})
    .limit(20);
    res.status(200).send(employees);

});

app.get("/api/employee/:id", async(req, res) => {
    const employee = await Employee.findById(req.params.id)
    .populate("user")
    .populate("department");

    if(!employee) {
        return res.status(404).send("Not Found");
    } 
    res.status(200).send(employee);
});

app.post("/api/create", async(req, res) => {
    const { first_name, last_name, birthday, username, password, role, department_name } = req.body;

    try {
        const hashPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ username, password: hashPassword, role});
        const newDepartment = await Department.create({ department_name });

        const newEmployee = await Employee.create({
            first_name,
            last_name,
            birthday,
            user: [newUser._id],
            department: [newDepartment._id]
        });
        res.status(201).send(newEmployee);
    } catch(err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

app.put("/api/update-employee/:id", async (req, res) => {
    const {
        first_name,
        last_name,
        birthday,
        username,
        password,
        role,
        department_name
    } = req.body;

    try {
        const hashPassword = await bcrypt.hash(password, 10)

        const employee = await Employee.findById(req.params.id)
        .populate("user")
        .populate("department")

        const user = await User.findById(employee.user);
        const department = await Department.findById(employee.department);

        if(!employee) {
            return res.status(404).send("Employee doesn't exist");
        }

        if (first_name !== undefined) employee.first_name = first_name;
        if (last_name !== undefined) employee.last_name = last_name;
        if (birthday !== undefined) employee.birthday = birthday
        if (user) {
            if (username !== undefined) employee.user.username = username;
            if (hashPassword !== undefined) employee.user.password = hashPassword;
            if (role !== undefined) employee.user.role = role;
            await employee.user.save();
        }
        if (department) {
            if (department_name !== undefined) employee.department.department_name = department_name;
            await employee.department.save();
        }

        await employee.save();

        res.status(200).send(employee);
    } catch(err) {
        console.error(err)
        res.status(500).send("Server Error");
    }
});

app.delete("/api/remove-employee/:id", async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if(!employee) {
            return res.status(404).send("Employee Doesn't Exist");
        }

        await employee.deleteOne();

        res.status(200).send("Employee Remove Successfully...");
    } catch(err) {
        res.status(500).send("Server Error");
    }
});

// API for tasks

app.get("/api/task", async (req, res) => {
    const task = await Task.find({})
    .populate("employee")
    .populate("department")
    .sort({createAt: -1})
    .limit(20);
    res.status(200).send(task)
});

app.get("/api/task/:id", async (req, res) => {
        const task = await Task.findById(req.params.id)
        .populate("employee");

        if(!task) {
            return res.status(404).send("Not Found");
        }
        res.status(200).send(task);
});

app.post("/api/create-task", async (req, res) => {
    const { difficult, priority } = req.body;

    try {
        const employeeId = req.body.employee || Employee._id;

        const newTask = await Task.create({
            difficult,
            priority,
            employee: [employeeId],
        });

        res.status(201).send(newTask);
    } catch(err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.put("/api/update-task/:id", async(req, res) => {
    const {
        difficult,
        priority,
        difficult_status,
        priority_status
    } = req.body;

    try {
        const task = await Task.findById(req.params.id)
        .populate("employee");

        if (difficult) task.difficult = difficult;
        if (priority) task.priority = priority;
        if (difficult_status) task.difficult_status = difficult_status;
        if (priority_status) task.priority_status = priority_status;
        await task.save();

        res.status(200).send(task);
    } catch (err) {
        console.error(err)
        res.status(500).send("Server Error");
    }
});

app.delete("/api/remove-task/:id", async(req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).send("Task Doesn't Exist");
        }

        await task.deleteOne();

        res.status(200).send("Task Remove Successfully ...");
    } catch (err) {
        res.status(500).send("Server Error");
    }
});


app.listen(PORT, () => {
    console.log(`Server Started in ${PORT} ...`)
});