const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt"); 

dotenv.config();

const app = express();
const PORT = 7000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use(express.static(__dirname));

const client = new MongoClient(process.env.MONGO_URI);
let db;
let dbName;

async function connectDB() {
    try {
        await client.connect();
        db = client.db("school_management");
        console.log(" MongoDB Connected");
    } catch (err) {
        console.error(" MongoDB Connection Error:", err.message);
        process.exit(1);
    }
}
connectDB();


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/:page", (req, res) => {
    const filePath = path.join(__dirname, `${req.params.page}.html`);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).send("Page Not Found");
        }
    });
});

app.post("/signup", async (req, res) => {
    try {
        if (!db) return res.status(500).json({ message: "Database not connected" });

        const { name, email, password, role } = req.body;
        const usersCollection = db.collection("users");

        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        
        await usersCollection.insertOne({ name, email, password, role });

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


app.post("/login", async (req, res) => {
    try {
        if (!db) return res.status(500).json({ message: "Database not connected" });

        const { email, password } = req.body;
        const usersCollection = db.collection("users");

        
        const user = await usersCollection.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        
        if (user.password !== password) {
            return res.status(400).json({ message: "Incorrect password" });
        }

  
        const redirectPage = user.role === "admin" ? "admin.html" : "index.html";

        res.json({ 
            message: "Login successful",
            role: user.role,
            redirect: redirectPage
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});


// Classes
app.post("/add-lecture", async (req, res) => {
    try {
        if (!db) return res.status(500).json({ message: "Database not connected" });

        const { startDate, endDate, startTime, endTime, days, status } = req.body;

        if (!startDate || !endDate || !startTime || !endTime || !days) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const lecturesCollection = db.collection("lectures");
        await lecturesCollection.insertOne({ startDate, endDate, startTime, endTime, days, status });

        res.status(201).json({ message: "Lecture added successfully!" });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


app.put("/update-lecture/:id", async (req, res) => {
    try {
        if (!db) return res.status(500).json({ message: "Database not connected" });

        const { id } = req.params;
        const { startDate, endDate, startTime, endTime, days, status } = req.body;
        const lecturesCollection = db.collection("lectures");

        const result = await lecturesCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { startDate, endDate, startTime, endTime, days, status } }
        );

        if (result.modifiedCount === 0) return res.status(404).json({ message: "Lecture not found or no changes made" });

        res.json({ message: "Lecture updated successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


app.post("/add-faculty", async (req, res) => {
    try {
        if (!db) return res.status(500).json({ message: "Database not connected" });

        console.log("Received Data:", req.body); // Debugging step

        const { name, contact, email, lecture } = req.body;

        if (!name || !contact || !email || !lecture) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const facultyCollection = db.collection("faculty");

        await facultyCollection.insertOne({ name, contact, email, lecture });

        res.status(201).json({ message: "Faculty member added successfully!" });

    } catch (error) {
        console.error("Error adding faculty:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


app.post("/add-event", async (req, res) => {
    try {
        if (!db) return res.status(500).json({ message: "Database not connected" });

        const { eventName, description, date } = req.body;

        console.log("Received data:", req.body); 

 
        if (!eventName || !description || !date) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const eventsCollection = db.collection("events");

        const eventData = { eventName, description, date };

        console.log("Inserting data into MongoDB:", eventData); 

        const result = await eventsCollection.insertOne(eventData);

        console.log("Insert result:", result);

        res.status(201).json({ message: "Event added successfully!" });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


//Subject 
app.post("/add-subject", async (req, res) => {
    try {
        if (!db) return res.status(500).json({ message: "Database not connected" });

        const { name, code, description, prerequisite } = req.body;
        const subjectsCollection = db.collection("subjects");

        await subjectsCollection.insertOne({ name, code, description, prerequisite });
        res.status(201).json({ message: "Subject added successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


// Update a subject
app.put("/update-subject/:id", async (req, res) => {
    try {
        if (!db) return res.status(500).json({ message: "Database not connected" });

        const { id } = req.params;
        const { name, code, description, prerequisite } = req.body;
        const subjectsCollection = db.collection("subjects");

        await subjectsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { name, code, description, prerequisite } }
        );

        res.json({ message: "Subject updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Delete a subject
app.delete("/delete-subject/:id", async (req, res) => {
    try {
        if (!db) return res.status(500).json({ message: "Database not connected" });

        const { id } = req.params;
        const subjectsCollection = db.collection("subjects");

        await subjectsCollection.deleteOne({ _id: new ObjectId(id) });
        res.json({ message: "Subject deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});



app.post("/parents", async (req, res) => {
    try {
        if (!db) return res.status(500).json({ message: "Database not connected" });

        console.log(req.body); 

        const { name, contact, email, address, relationship, profilePic } = req.body;
        const parentsCollection = db.collection("parents");

        const parent = await parentsCollection.insertOne({ name, contact, email, address, relationship, profilePic });
        res.status(201).json({ message: "Parent profile added successfully", parentId: parent.insertedId });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

app.post("/add-student", async (req, res) => {
    try {
        if (!db) return res.status(500).json({ message: "Database not connected" });

        const { name, className } = req.body; 
        const studentsCollection = db.collection("students");

        const student = await studentsCollection.insertOne({ name, className });
        res.status(201).json({ message: "Student added successfully", studentId: student.insertedId });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

//  Link Parent to Student
app.post("/link-parent-student", async (req, res) => {
    try {
        if (!db) return res.status(500).json({ message: "Database not connected" });

        const { parentId, studentId } = req.body;
        const studentsCollection = db.collection("students");

        await studentsCollection.updateOne(
            { _id: new ObjectId(studentId) },
            { $set: { parentId: new ObjectId(parentId) } }
        );
        res.json({ message: "Parent linked to student successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

//  Get Parent with Student Info
app.get("/parent/:id", async (req, res) => {
    try {
        if (!db) return res.status(500).json({ message: "Database not connected" });

        const parent = await db.collection("parents").findOne({ _id: new ObjectId(req.params.id) });
        if (!parent) return res.status(404).json({ message: "Parent not found" });

        const student = await db.collection("students").findOne({ parentId: new ObjectId(req.params.id) });
        res.json({ parent, student });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


// Textbooks
app.post("/add-book", async (req, res) => {
    try {
        if (!db) return res.status(500).json({ message: "Database not connected" });
        
        const { title, author, edition, subject, isbn, publisher, quantity } = req.body;
        const booksCollection = db.collection("books");
        
        const newBook = await booksCollection.insertOne({ title, author, edition, subject, isbn, publisher, quantity });
        res.status(201).json({ message: "Book added successfully", bookId: newBook.insertedId });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


// Update Book Details
app.put("/update-book/:id", async (req, res) => {
    try {
        if (!db) return res.status(500).json({ message: "Database not connected" });
        
        const { id } = req.params;
        const { title, author, edition, subject, isbn, publisher, quantity } = req.body;
        const booksCollection = db.collection("books");
        
        await booksCollection.updateOne({ _id: new ObjectId(id) }, { $set: { title, author, edition, subject, isbn, publisher, quantity } });
        res.json({ message: "Book updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Delete Book
app.delete("/delete-book/:id", async (req, res) => {
    try {
        if (!db) return res.status(500).json({ message: "Database not connected" });
        
        const { id } = req.params;
        const booksCollection = db.collection("books");
        
        await booksCollection.deleteOne({ _id: new ObjectId(id) });
        res.json({ message: "Book deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

//Eams 

app.post('/exams', async (req, res) => {
    try {
        const { exam_name, subject, date, duration, max_marks } = req.body;

        // Ensure all required fields are provided
        if (!exam_name || !subject || !date || !duration || !max_marks) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const examsCollection = db.collection('exams');
        const newExam = { exam_name, subject, date, duration, max_marks };

        // Insert new exam into MongoDB
        await examsCollection.insertOne(newExam);
        res.status(201).json({ message: 'Exam added successfully' });
    } catch (error) {
        console.error('Error adding exam:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});



//Grade
app.post('/grades', async (req, res) => {
    const { studentId, subject, assessment, score } = req.body;
  
    const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";
  
    const gradeObj = {
      studentId,
      subject,
      assessment,
      score,
      grade
    };
  
    try {

      await db.collection('grades').insertOne(gradeObj);
      res.status(201).json({ message: "Grade added successfully", grade: gradeObj });
    } catch (error) {
      console.error("Error adding grade:", error);
      res.status(500).json({ message: "Failed to add grade" });
    }
  });
    
  app.put('/grades/:id', async (req, res) => {
    const gradeId = req.params.id;
    const { score } = req.body;
  
    const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";
  
    try {
      const updatedGrade = await db.collection('grades').updateOne(
        { _id: new MongoClient.ObjectID(gradeId) },
        { $set: { score, grade } }
      );
  
      if (updatedGrade.matchedCount === 0) {
        return res.status(404).json({ message: "Grade not found" });
      }
  
      res.status(200).json({ message: "Grade updated successfully" });
    } catch (error) {
      console.error("Error updating grade:", error);
      res.status(500).json({ message: "Failed to update grade" });
    }
  });
  
  app.delete('/grades/:id', async (req, res) => {
    const gradeId = req.params.id;
  
    try {
      const deletedGrade = await db.collection('grades').deleteOne({ _id: new MongoClient.ObjectID(gradeId) });
  
      if (deletedGrade.deletedCount === 0) {
        return res.status(404).json({ message: "Grade not found" });
      }
  
      res.status(200).json({ message: "Grade deleted successfully" });
    } catch (error) {
      console.error("Error deleting grade:", error);
      res.status(500).json({ message: "Failed to delete grade" });
    }
  });

// Fees
app.post("/payments", async (req, res) => {
  const { studentId, studentName, paymentStatus, paymentMethod, amount } = req.body;

  try {
    const newPayment = {
      studentId,
      studentName,
      paymentStatus,
      paymentMethod,
      amount,
      date: new Date()
    };


    if (!paymentsCollection) {
      return res.status(500).json({ error: "Database connection error" });
    }

    const result = await paymentsCollection.insertOne(newPayment);

    res.status(201).json({
      message: "Payment added successfully",
      payment: result.ops[0] 
    });
  } catch (error) {
    console.error("Error adding payment:", error);
    res.status(500).json({ error: "Failed to add payment" });
  }
});


app.get("/payments/:studentId", async (req, res) => {
  const { studentId } = req.params;

  try {

    if (!paymentsCollection) {
      return res.status(500).json({ error: "Database connection error" });
    }

    const payments = await paymentsCollection.find({ studentId }).toArray();

    if (payments.length === 0) {
      return res.status(404).json({ message: "No payments found for this student" });
    }

    res.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});


app.delete("/payments/:id", async (req, res) => {
  const { id } = req.params;

  try {

    if (!paymentsCollection) {
      return res.status(500).json({ error: "Database connection error" });
    }

    const paymentId = new ObjectId(id);


    const result = await paymentsCollection.deleteOne({ _id: paymentId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json({ message: "Payment deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment:", error);
    res.status(500).json({ error: "Failed to delete payment" });
  }
});

// School feess
app.get("/check-payment/:studentId", async (req, res) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection("payments");

        const studentId = req.params.studentId;
        const student = await collection.findOne({ studentId: studentId });

        if (student) {
            res.json({
                status: student.paymentStatus,
                method: student.paymentMethod,
                amountPaid: student.amountPaid
            });
        } else {
            res.json({ error: "Student not found" });
        }
    } catch (error) {
        console.error(" Error Checking Payment:", error);
        res.status(500).json({ error: error.message });
    }
});

//  Add Payment Record
app.post("/add-payment", async (req, res) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection("payments");

        const { studentId, paymentStatus, paymentMethod, amountPaid } = req.body;

        if (!studentId || !paymentStatus || !paymentMethod || amountPaid === undefined) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const result = await collection.insertOne({ studentId, paymentStatus, paymentMethod, amountPaid });

        if (result.acknowledged) {
            res.json({ message: "Payment record added successfully" });
        } else {
            res.status(500).json({ error: "Failed to insert data into MongoDB" });
        }
    } catch (error) {
        console.error(" Error Adding Payment:", error);
        res.status(500).json({ error: error.message });
    }
});

// Admin
app.get("/admin/data", async (req, res) => {
    try {
        if (!db) return res.status(500).json({ message: "Database not connected" });

      
        const classes = await db.collection("lectures").find().toArray();
        const faculties = await db.collection("faculty").find().toArray();
        const events = await db.collection("events").find().toArray();
        const subjects = await db.collection("subjects").find().toArray();
        const parents = await db.collection("parents").find().toArray();
        const books = await db.collection("books").find().toArray();
        const payments = await db.collection("payments").find().toArray();
        const examScores = await db.collection("exams").find().toArray();
        const grades = await db.collection("grades").find().toArray();

       
        const formattedFaculties = faculties.map(faculty => ({
            name: faculty.name || "No Name",
            contact: faculty.contact || "No Contact Number",
            email: faculty.email || "No Email",
            lecture: faculty.lecture || "No Selected Subject"
        }));

      
        const linkedParents = await Promise.all(parents.map(async (parent) => {
            const student = await db.collection("students").findOne({ _id: new ObjectId(parent.studentId) });
            return { ...parent, studentName: student ? student.name : "Unknown" };
        }));

       
        const formattedGrades = grades.map(grade => ({
            studentId: grade.studentId || "No Student ID",
            subject: grade.subject || "No Subject",
            assessment: grade.assessment || "No Assessment",
            score: grade.score !== undefined ? grade.score : "No Score",
            grade: grade.grade || "No Grade",
            remarks: grade.remarks || "No Remarks"
        }));

        res.json({
            classes,
            faculties: formattedFaculties, 
            events,
            subjects,
            linkedParents,
            books,
            payments,
            examScores,
            formattedGrades
        });

    } catch (error) {
        res.status(500).json({ message: "Error fetching data", error: error.message });
    }
});


app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
});