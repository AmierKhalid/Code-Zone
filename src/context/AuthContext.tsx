// import { getCurrentUser } from '@/lib/Appwrite/api';
// import { IContextType, IUser } from '@/types';
// import React, {createContext,useContext,useState,useEffect} from 'react'
// import { useNavigate } from 'react-router-dom'; 
// export const INITIAL_USER = {
//   id: "",
//   name: "",
//   username: "",
//   email: "",
//   imageUrl: "",
//   bio: "",
// };

// const INITIAL_STATE = {
//   user: INITIAL_USER,
//   isLoading: false,
//   isAuthenticated: false,
//   setUser: () => {},
//   setIsAuthenticated: () => {},
//   checkAuthUser: async () => false as boolean,
// };

// const AuthContext = createContext<IContextType>(INITIAL_STATE);

// const AuthProvider = ({children}:{children:React.ReactNode}) => {
//   const [user, setUser] = useState<IUser>(INITIAL_USER);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const checkAuthUser = async ()=>{
//     try {
//       const currentAccount = await getCurrentUser()
//       if (currentAccount) {
//         setUser({
//           id: currentAccount.$id,
//           name: currentAccount.name,
//           username: currentAccount.username,
//           email: currentAccount.email,
//           imageUrl: currentAccount.imageUrl,
//           bio: currentAccount.bio,
//         })
//         setIsAuthenticated(true);
//         return true
//       }
//       return false;
//     } catch (error) {
//       console.log(error,"user is not authenticated");
//       return false;
//     }
//     finally{
//       setIsLoading(false);
//     }
//   };
//   const navigate= useNavigate();
//   useEffect(() => {
//     if (localStorage.getItem("cookieFallback")==="[]"
//     ||localStorage.getItem("cookieFallback")===null) 
//     navigate("/sign-in")
//     checkAuthUser();
//   }, [])
  

//   const value = {
//     user,
//     isLoading,
//     isAuthenticated,
//     setUser,
//     setIsAuthenticated,
//     checkAuthUser,
//   }
//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   )
// }

// export default AuthProvider

// export const useUserContext=()=>useContext(AuthContext);








import { getCurrentUser } from '@/lib/Appwrite/api';
import { IContextType, IUser } from '@/types';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const INITIAL_USER: IUser = {
  id: "",
  name: "",
  username: "",
  email: "",
  imageUrl: "",
  bio: "",
};

const INITIAL_STATE: IContextType = {
  user: INITIAL_USER,
  isLoading: false,
  isAuthenticated: false,
  setUser: () => {},
  setIsAuthenticated: () => {},
  checkAuthUser: async () => false as boolean,
};

const AuthContext = createContext<IContextType>(INITIAL_STATE);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<IUser>(INITIAL_USER);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const checkAuthUser = async () => {
    setIsLoading(true); // Set loading to true at the start
    try {
      const currentAccount = await getCurrentUser();
      if (currentAccount) {
        setUser({
          id: currentAccount.$id,
          name: currentAccount.name,
          username: currentAccount.username,
          email: currentAccount.email,
          imageUrl: currentAccount.imageUrl,
          bio: currentAccount.bio,
        });
        setIsAuthenticated(true);
        return true;
      } else {
        setIsAuthenticated(false);
        navigate("/sign-in");
        return false;
      }
    } catch (error) {
      console.log("User is not authenticated", error);
      setIsAuthenticated(false);
      navigate("/sign-in");
      return false;
    } finally {
      setIsLoading(false); // Set loading to false at the end
    }
  };
///////////////////////temporary 
  useEffect(() => {
    const cookieFallback = localStorage.getItem("cookieFallback");
    if (cookieFallback === "[]" || cookieFallback === null) {
      navigate("/sign-in");
    } else {
      checkAuthUser();
    }
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    setUser,
    setIsAuthenticated,
    checkAuthUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

export const useUserContext = () => useContext(AuthContext);
