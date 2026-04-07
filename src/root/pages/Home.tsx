import Loader from "@/components/shared/Loader";
import PostCard from "@/components/shared/PostCard";

const MOCK_POST = {
  $id: '1',
  caption: 'Check out my new setup! 💻💜',
  tags: ['Tech', 'Coding', 'Setup'],
  location: 'Ismailia, Egypt',
  $createdAt: new Date().toISOString(),
  imageUrl: "/assets/images/25650952_kerfin7_nea_2633.jpg", 
  creator: {
    $id: 'user1',
    name: 'Mohamed Saleh',
    username: 'mo_saleh',
    imageUrl: '' 
  }
};

const TOP_CONTRIBUTORS = [
  { id: 1, name: "Alex CodeMa...", username: "alexcodemaster", points: "12,500", badge: "Legend", color: "text-fuchsia-500", icon: "🥇" },
  { id: 2, name: "Sarah DevPro", username: "sarahdevpro", points: "9,800", badge: "Grandmaster", color: "text-purple-500", icon: "🥈" },
  { id: 3, name: "Mike ScriptWiz", username: "mikescriptwiz", points: "7,500", badge: "Grandmaster", color: "text-purple-500", icon: "🥉" },
  { id: 4, name: "Emma TechGuru", username: "emmatechguru", points: "6,200", badge: "Master", color: "text-primary-500", icon: "#4" },
  { id: 5, name: "John CodeNinja", username: "johncodeninja", points: "5,100", badge: "Master", color: "text-primary-500", icon: "#5" },
];

const Home = () => {
  const isLoading = false; 

  if (isLoading) {
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <div className="home-container">
        <div className="home-posts">
          <h2 className="h3-bold md:h2-bold text-left w-full mb-7">Home Feed</h2>
          
          <ul className="flex flex-col flex-1 gap-9 w-full">
            <li className="flex justify-center w-full">
              <PostCard post={MOCK_POST as any} />
            </li>
          </ul>
        </div>
      </div>

      <div className="home-creators hidden xl:flex flex-col w-72 min-w-[420px] px-8 py-10 border-l border-dark-4 transition-all duration-300">
        <div className="flex flex-col gap-2 mb-10">
          <h3 className="h3-bold flex items-center gap-2">
            <span className="text-xl">🏆</span> Leaderboard
          </h3>
          <p className="small-medium text-light-3">Top Contributors</p>
        </div>

        <div className="flex flex-col gap-6 w-full">
          {TOP_CONTRIBUTORS.map((user) => (
            <div 
              key={user.id} 
              className="flex items-center justify-between w-full group cursor-pointer hover:bg-dark-3 p-3 rounded-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-light-3 w-6 text-center">{user.icon}</span>
                <div className="w-10 h-10 rounded-full bg-dark-4 flex items-center justify-center border border-dark-4 overflow-hidden">
                   <img 
                    src="/assets/icons/profile-placeholder.svg" 
                    className="w-6 h-6 invert dark:invert-0" 
                    alt="profile"
                   />
                </div>
                <div className="flex flex-col">
                  <p className="body-bold text-[14px] leading-tight">{user.name}</p>
                  <p className="text-[11px] text-light-3">@{user.username}</p>
                  <p className={`text-[11px] font-semibold mt-1 ${user.color}`}>{user.badge}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-primary-500 font-bold text-[13px]">{user.points}</p>
                <p className="text-[10px] text-light-3 uppercase font-bold">pts</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home;