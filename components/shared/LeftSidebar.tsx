//-------------this is from the original project --------------------
//-------------we will edit it to be compatible with nextjs app directory structure-------------------



// import { useEffect } from 'react'
// import { Link,NavLink,useNavigate,useLocation } from 'react-router-dom'
// import { Button } from '../ui/button'
// import { useSignOutAccount } from '@/lib/react-query/queries&mutations'
// import { useUserContext } from '@/context/AuthContext'
// import { sidebarLinks } from '@/constants'
// import { INavLink } from '@/types'
// import { getProfileImageUrl } from '@/lib/utils'

// const LeftSidebar = () => {
//   const {pathname}=useLocation();
//   const { mutate: signOut, isSuccess} =useSignOutAccount();
//   const navigate = useNavigate();
//   const {user}= useUserContext();
//   useEffect(() => {
//     if (isSuccess) {
//      navigate(0);
//     }
//   },[isSuccess])
//   return (
//     <nav className='leftsidebar'>
//       <div className='flex flex-col gap-11'>
//         <Link to="/" className='flex gap-3 items-center ' >
//         <img className='w-12 h-12' src="/public/assets/images/logo.svg" alt="" 
//         height={36}
//         width={170}/>
//                     <h1 className="text-[25px] te font-bold whitespace-nowrap text-center">
//               Code-<span className="text-fuchsia-500">Zone</span>
//             </h1>
//         </Link>
// <Link to={`/profile/${user.id}`} className='flex gap-3 items-center'>
//       <img
//           src={getProfileImageUrl(user)} className='h-14 w-14 rounded-full'/>
//           <div className='flex flex-col '>
//             <p className='body-bold'>
//               {user.name}
//             </p>
//             <p className='small-regular text-light-3'>
//               @{user.username}
//             </p>
//           </div>
//           </Link>
//           <ul className='flex flex-col gap-6'>
//             {sidebarLinks.map((link:INavLink)=>{
//               const isActive = pathname === link.route;
//               return(
//                 <li key={link.label} className={`group transition leftsidebar-link ${isActive && "bg-primary-500  "}`}>
//                 <NavLink to={link.route} className="flex gap-4 items-center p-4" >
//                   <img className={`group-hover:invert-white ${isActive && "invert-white"}`} src={link.imgURL}/>
//                   {link.label}
//                 </NavLink>
//                 </li>
//               )
//             })}
//           </ul>
//       </div>
//       <Button variant="ghost" className='shad-button_ghost' onClick={()=>signOut()}>
//             <img src='/public/assets/icons/logout.svg'/>
//             <p className='small-medium lg:base-medium'>
//               Logout
//             </p>
//           </Button>
//     </nav>
//   )
// }

// export default LeftSidebar
