export const usernameController = (req,res) => {
    const username = req.params.username
    res.send(`Welcome ${username}`)
}

export const searchController = (req,res) => {
    const keyword = req.query.keyword
    res.send(`Searching for ${keyword}`)
}

//login signup

export const userLogin = (req,res) => {
    res.send(`Login route`)
}

export const userSignup = (req,res) => {
    res.send(`Signup route`)
}
