import Link from "next/link";
import type { ProfileUser } from "@/lib/profileData";
import ProfileBackButton from "./ProfileBackButton";
import ProfileTabs from "./ProfileTabs";
import FollowToggleButton from "./FollowToggleButton";
import ShareLinkButton from "./ShareLinkButton";


type StatBlockProps = {
  value: string | number;
  label: string;
};

function StatBlock({ value, label }: StatBlockProps) {
  return (
    <div className="flex-center gap-2">
      <p className="small-semibold lg:body-bold text-primary-500">{value}</p>
      <p className="small-medium lg:base-medium text-light-2">{label}</p>
    </div>
  );
}

type ProfileHeaderProps = {
  profile: ProfileUser;
  profileId: string;
  currentUserId: string | null;
  initialIsFollowing: boolean;
};

export default function ProfileHeader({
  profile,
  profileId,
  currentUserId,
  initialIsFollowing,
}: ProfileHeaderProps) {
  const isOwnProfile = currentUserId === profileId;
  const imageSrc = profile.image || "/icons/profile-placeholder.svg";

  return (
    <>
      <ProfileBackButton />

      <div className="profile-inner_container">
        <div className="flex xl:flex-row flex-col max-xl:items-center flex-1 gap-7">
          <img
            src={imageSrc}
            alt="profile"
            className="w-28 h-28 lg:h-36 lg:w-36 rounded-full object-cover"
          />

          <div className="flex flex-col flex-1 justify-between md:mt-2">
            <div className="flex flex-col w-full">
              <h1 className="text-center xl:text-left h3-bold md:h1-semibold w-full">
                {profile.name ?? profile.username ?? "User"}
              </h1>
              <p className="small-regular md:body-medium text-light-3 text-center xl:text-left">
                @{profile.username ?? "username"}
              </p>
            </div>

            <div className="flex gap-8 mt-10 items-center justify-center xl:justify-start flex-wrap z-20">
              <StatBlock value={profile.postsCount} label="Posts" />
              <StatBlock value={profile.followersCount} label="Followers" />
              <StatBlock value={profile.followingCount} label="Following" />
            </div>

            {profile.bio && (
              <p className="small-medium md:base-medium mt-7 w-full max-w-3xl text-center text-light-2 xl:text-left">
                {profile.bio}
              </p>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            <ShareLinkButton
              path={`/profile/${profileId}`}
              shareTitle={`${profile.name ?? profile.username ?? "Profile"} (@${profile.username ?? "user"})`}
              shareText="View this profile on Code Zone"
              withLabel
              className="h-12 border border-dark-4 bg-dark-4 px-5 hover:bg-dark-3"
            />
            {isOwnProfile && (
              <Link
                href={`/update-profile/${profileId}`}
                className="h-12 bg-dark-4 px-5 text-light-1 flex-center gap-2 rounded-lg"
              >
                <img src="/icons/edit.svg" alt="edit" width={20} height={20} />
                <p className="flex whitespace-nowrap small-medium">Edit Profile</p>
              </Link>
            )}
            {!isOwnProfile && (
              <>
                <Link
                  href={`/Message?with=${profileId}`}
                  className="h-12 flex-center gap-2 rounded-lg border border-dark-4 bg-dark-4 px-5 small-medium text-light-1 transition hover:bg-dark-3"
                >
                  <img src="/icons/chat.svg" alt="" width={20} height={20} />
                  Message
                </Link>
                <FollowToggleButton
                  targetUserId={profileId}
                  initialIsFollowing={initialIsFollowing}
                />
              </>
            )}
          </div>
        </div>
      </div>


    </>
  );
}
