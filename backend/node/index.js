const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
    console.log('New incoming request...')
    res.send('Hello streaming data sources!')
})

app.listen(port, () => {
    console.log(`Minimal streaming app listening at http://localhost:${port}`)
    console.log('Ready to roll!')
})
