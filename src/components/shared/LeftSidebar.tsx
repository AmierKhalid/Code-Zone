import { useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../ui/button'
import { useSignOutAccount } from '@/lib/react-query/queries&mutations'
import { useUserContext } from '@/context/AuthContext'
import { sidebarLinks } from '@/constants'
import { INavLink } from '@/types'
import { getProfileImageUrl } from '@/lib/utils'
import { useTheme } from '@/context/ThemeContext'

const LeftSidebar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useUserContext();
  const { theme, toggleTheme } = useTheme();
  const { mutate: signOut, isSuccess } = useSignOutAccount();

  useEffect(() => {
    if (isSuccess) navigate(0);
  }, [isSuccess])

  return (
    <nav className='leftsidebar flex flex-col justify-between'>
      <div className='flex flex-col gap-11'>
        <Link to="/" className='flex gap-3 items-center'>
          <img className='w-12 h-12' src="/assets/images/logo.svg" alt="logo" />
          <h1 className="text-[25px] font-bold whitespace-nowrap">
            Code-<span className="text-fuchsia-500">Zone</span>
          </h1>
        </Link>

        <Link to={`/profile/${user.id}`} className='flex gap-3 items-center'>
          <img src={getProfileImageUrl(user)} className='h-14 w-14 rounded-full' />
          <div className='flex flex-col'>
            <p className='body-bold'>{user.name}</p>
            <p className="small-regular text-light-3">@{user.username}</p>
          </div>
        </Link>

        <ul className='flex flex-col gap-2'>
          {sidebarLinks.map((link: INavLink) => {
            const isActive = pathname === link.route;
            return (
              <li key={link.label} className={`group transition leftsidebar-link ${isActive && "bg-primary-500"}`}>
                <NavLink to={link.route} className="flex gap-4 items-center p-4">
                  <img 
                    className={`group-hover:invert-white ${isActive && "invert-white"}`} 
                    src={link.imgURL} 
                  />
                  {link.label}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="flex flex-col gap-2 border-t border-dark-4 pt-6">
        <NavLink 
          to="/settings" 
          className={`group transition leftsidebar-link flex gap-4 items-center p-4 ${pathname === '/settings' ? "bg-primary-500" : "hover:bg-primary-500"}`}
        >
          <img 
            src="/assets/icons/settings.svg" 
            alt="settings"
            className={`group-hover:invert-white ${pathname === '/settings' && "invert-white"}`}
            width={24}
            height={24}
            onError={(e) => (e.currentTarget.src = "/assets/icons/filter.svg")}
          />
          <span className="group-hover:text-white">Settings</span>
        </NavLink>

        <Button 
          variant="ghost" 
          className='shad-button_ghost hover:bg-primary-500 transition group flex justify-start gap-4 p-4 h-auto w-full' 
          onClick={toggleTheme}
        >
          <img 
            src={theme === 'dark' ? "/assets/icons/moon.svg" : "/assets/icons/sun.svg"} 
            alt="mode"
            className="group-hover:invert-white"
            width={24} 
            height={24}
            onError={(e) => (e.currentTarget.src = "/assets/icons/wallpaper.svg")}
          />
          <p className='small-medium lg:base-medium group-hover:text-white'>
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </p>
        </Button>

        <Button 
          variant="ghost" 
          className='shad-button_ghost hover:bg-primary-500 transition group flex justify-start gap-4 p-4 h-auto w-full' 
          onClick={() => signOut()}
        >
          <img 
            src="/assets/icons/logout.svg" 
            className="group-hover:invert-white" 
            width={24} 
            height={24} 
          />
          <p className='small-medium lg:base-medium group-hover:text-white'>Logout</p>
        </Button>
      </div>
    </nav>
  )
}

export default LeftSidebar;