import {
  createCampaign,
  dashboard,
  logout,
  payment,
  profile,
  withdraw,
} from "../assets";

export const navlinks = [
  {
    name: "dashboard",
    imgUrl: dashboard,
    link: "/",
  },
  {
    name: "campaign",
    imgUrl: createCampaign,
    link: "/create-campaign",
  },
  {
    name: "Airdrop",
    imgUrl: withdraw,
    link: "/claim",
    disabled: true
  },
  {
    name: "my camps",
    imgUrl: profile,
    link: "/profile"
  },
  {
    name: "Claim NFTS",
    imgUrl: withdraw,
    link: "/claim",
  }
];
