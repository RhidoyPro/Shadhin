interface State {
  id: number;
  name: string;
  nameBn: string;
  slug: string;
}
const BangladeshStates: State[] = [
  { id: 0, name: "All Districts", nameBn: "সব জেলা", slug: "all-districts" },
  { id: 1, name: "Dhaka", nameBn: "ঢাকা", slug: "dhaka" },
  { id: 2, name: "Chattogram", nameBn: "চট্টগ্রাম", slug: "chattogram" },
  { id: 3, name: "Khulna", nameBn: "খুলনা", slug: "khulna" },
  { id: 4, name: "Rajshahi", nameBn: "রাজশাহী", slug: "rajshahi" },
  { id: 5, name: "Sylhet", nameBn: "সিলেট", slug: "sylhet" },
  { id: 6, name: "Barishal", nameBn: "বরিশাল", slug: "barishal" },
  { id: 7, name: "Rangpur", nameBn: "রংপুর", slug: "rangpur" },
  { id: 8, name: "Mymensingh", nameBn: "ময়মনসিংহ", slug: "mymensingh" },
];

export default BangladeshStates;
