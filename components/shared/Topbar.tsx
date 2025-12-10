
//-------------this is from the original project --------------------
//-------------we will edit it to be compatible with nextjs app directory structure-------------------



// import { useEffect } from 'react'
// import { Link,useNavigate } from 'react-router-dom'
// import { Button } from '../ui/button'
// import { useSignOutAccount } from '@/lib/react-query/queries&mutations'
// import { useUserContext } from '@/context/AuthContext'
// import { getProfileImageUrl } from '@/lib/utils'

// const Topbar = () => {
//   const { mutate: signOut, isSuccess} =useSignOutAccount();
//   const navigate = useNavigate();
//   const {user}= useUserContext();
//   useEffect(() => {
//     if (isSuccess) {
//      navigate(0);
//     }
//   },[isSuccess])
//   return (
//     <section className='topbar'>
//       <div className='flex-between py-4 px-5'>
//         <Link to="/" className='flex gap-3 items-center ' >
//         <img className='w-12 h-12' src="/public/assets/images/logo.svg" alt="" 
//         height={325}
//         width={130}/>
//                             <h1 className="text-[25px] te font-bold whitespace-nowrap text-center">
//               Code-<span className="text-fuchsia-500">Zone</span>
//             </h1>
//         </Link>
//         <div className='flex gap-4'>
//           <Button variant="ghost" className='shad-button_ghost' onClick={()=>signOut()}>
//             <img src='/public/assets/icons/logout.svg'/>
//           </Button>
//           <Link to={`/profile/${user.id}`} className='flex-center gap-3'>
//           <img
//           src={getProfileImageUrl(user)} className='h-8 w-8 rounded-full'/>
//           </Link>
//         </div>
//       </div>
//     </section>
//   )
// }

// export default Topbar
