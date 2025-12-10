//-------------this is from the original project --------------------
//-------------we will edit it to be compatible with nextjs app directory structure-------------------



// import { bottombarLinks } from '@/constants';

// import { Link,useLocation } from 'react-router-dom'

// const Bottombar = () => {
//   const {pathname}=useLocation();
//   return (
// <section className='bottom-bar'>
// {bottombarLinks.map((link)=>{
//               const isActive = pathname === link.route;
//               return(
                
//                 <Link to={link.route} key={link.label}  className={`flex-center transition flex-col gap-1 p-2  ${isActive && "bg-primary-500 rounded-[10px]"}`} >
//                   <img width={16} height={16} className={`group-hover:invert-white ${isActive && "invert-white"}`} src={link.imgURL}/>
//                   <p className='tiny-medium text-light-2'>{link.label}</p>
//                 </Link>
//               )
//             })}
// </section>
//   )
// }

// export default Bottombar
