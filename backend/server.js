const express = require('express');
const app = express();
const port = 3000; // Or any desired port

// Define a simple GET route
app.get('/', (req, res) => {
  res.send('Hello World from Express!');
});

// Start the server
app.listen(port, () => {
  console.log(`Express app listening at http://localhost:${port}`);
});
