import React, { useState, useEffect } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase, ref, set, child, get } from "firebase/database";

const STRIPE_API_KEY = process.env.REACT_APP_STRIPE_KEY

export default function App() {
  const getUserFromLS = () => {
    const found = localStorage.getItem('shop_user');
    if (found) {
      return JSON.parse(found)
    }
    return {}
  };

  const [user, setUser] = useState(getUserFromLS());
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({size: 0});

  const auth = getAuth();
  const provider = new GoogleAuthProvider();

  const createPopup = async () => {
    const result = await signInWithPopup(auth, provider)
    const user = result.user
    localStorage.setItem('shop_user', JSON.stringify(user))
    setUser(user)
    getCart(user)
  };

  const logOut = () => {
    localStorage.removeItem('shop_user')
    setUser({})
    setCart({size:0})
  };


  const getProducts = async () => {
    const res = await fetch('https://api.stripe.com/v1/products', {
      method: "GET",
      headers: {Authorization: `Bearer ${STRIPE_API_KEY}`}
    });
    const data = await res.json();
    console.log(data)
    setProducts(data.data)
  };

  useEffect(()=>{getProducts()}, [])
  useEffect(()=>{if (user.uid){getCart(user)}},[user])

  const showProducts = () => {
    return products.map(p=><div key={p.id} style={{width:"18rem", border:'1px solid grey'}}>
      <h1>{p.name}</h1>
      <p>{p.description}</p>
      <button onClick={()=>{addToCart(p)}}>Add To Cart</button>
    </div>)
  };

  const addToDB = (cart) => {
    const db = getDatabase();
    set(ref(db, `/cart/${user.uid}`), cart)
  };

  const getCart = async (user) => {
    const dbRef = ref(getDatabase())
    const snapshot = await get(child(dbRef, `/cart/${user.uid}`))
    if (snapshot.exists()){
      setCart(snapshot.val())
    }
  }

  const addToCart = (item) => {
    const newCart = {...cart};
    if (item.id in newCart) {
      newCart[item.id].qty++;
    }
    else {
      newCart[item.id] = item
      newCart[item.id].qty = 1
    }
    newCart.size++

    setCart(newCart)
    if (user.uid){
      // updateDB
      addToDB(newCart)
    }

  };

  return (
    <div>
      <h1>{user.uid?user.displayName:"GUEST"} | {cart.size}</h1>

      <div className='row'>
        {showProducts()}
      </div>

      {user.uid?
      <button onClick={logOut}>Log Out</button>
      :
      <button onClick={createPopup}>Sign In With Google</button>
      }


    </div>
  )
}
