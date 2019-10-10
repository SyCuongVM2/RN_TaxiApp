const express = require('express');
const mongoose = require('mongoose');
const socket = require('socket.io');

const mongoDbConnString = require('./config/mongodb');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/users');
const authMiddleware = require('./middleware/auth');
const errorMiddleware = require('./middleware/error');

const PORT = 5000;

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/auth", authRouter);
app.use("*", authMiddleware);
app.use("/users", userRouter);
app.use(errorMiddleware);

mongoose.connect(mongoDbConnString, { 
    useNewUrlParser: true, 
    useCreateIndex: true, 
    useUnifiedTopology: true 
  }).then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error(err.message));

const server = app.listen(PORT, () => {
  console.log("Server is running on port: " + PORT);
});

const io = socket(server);
let taxiSocket = null;
let passengerSocket = null;
io.on("connection", socket => {
  console.log("A user is connected with id: " + socket.id);

  socket.on("taxiRequest", taxiRoute => {
    passengerSocket = socket;
    console.log("The Passenger wants a taxi!");
    if (taxiSocket !== null) {
      taxiSocket.emit("taxiRequest", taxiRoute);
    }
  });

  socket.on("driverLocation", driverLocation => {
    console.log(driverLocation);
    passengerSocket.emit("driverLocation", driverLocation);
  });

  socket.on("passengerRequest", () => {
    console.log("The Driver is looking for passengers!");
    taxiSocket = socket;
  });
});