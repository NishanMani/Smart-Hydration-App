import express from 'express'
import { usernameController } from './controller.js'
import { searchController } from './controller.js'
import router from './route.js'

const app = express()

const PORT = 3000

                                // G E T 

app.get('/',(req,res) => {
    res.send('Hello, Express')
})

app.get('/about',(req,res) => {
    res.send(`This is the about route`)
})

app.get('/contact',(req,res) => {
    res.send(`This is the contact route`)
})

app.get('/users/:username',usernameController )

app.get('/search',searchController)

app.use('/user',router)

app.use(express.json())   // it commonly applies on post and put 

                                // P O S T

app.post('/users1', /*express.json() , */ (req,res)=>{    //express.json() => Middle man
    const {name,email} =req.body                    //Middle man user to parse data in req.body
    res.json({
        message:`User ${name} with email ${email} created Successfully`
    })
})
                                // P U T

app.put('/users1/:id', /*express.json() , */ (req,res) => {
    const userId = req.params.id
    const {name,email} =req.body
    res.json({
        message:`User ${userId} with email ${email} updated Successfully`
    })

})

                                // D E L E T E

app.delete('/users1/:id', /*express.json() , */ (req,res) => {
    const userId = req.params.id
    res.json({
        message:`User with ID ${userId} deleted Successfully`
    })

})

// Chain of Parameters

app.get('/things/:name/:id' , (req,res) => {
    const {name,id} = req.params
    res.json({
        name,
        id
    })
})

app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost:${PORT}`)
})