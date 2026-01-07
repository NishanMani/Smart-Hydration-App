import './App.css'
import Products from './Products'
import HeadPhone from './assets/HeadPhone.jpg'    
import Glass from './assets/Glass.jpg'    
import Shoe from './assets/Shoe.jpg'    
import Watch from './assets/Watch.jpg'

function App() {
  return (
    <>
      <Products img={HeadPhone} name="HeadPhone" price="$1200" />
      <Products img={Glass} name="Glass" price="$900" />
      <Products img={Shoe} name="Shoe" price="$700" />
      <Products img={Watch} name="Watch" price="$1100" />
    </>
  )
}

export default App
