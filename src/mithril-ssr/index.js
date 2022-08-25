import express from 'express'
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/posts/:post', (req, res) => {
  res.send('Hello post: ' + req.params.post)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})