import axios from "axios"

export async function getAtCoderHighest() {
  
  let highest = 0;
  
  try {
    const result = await axios.get("https://atcoder.jp/users/kyre/history/json");
    const contests = result.data;
    for (const contest in contests) {
      highest = Math.max(highest, contest["NewRating"]);
    }
  }

  catch (error) {
    highest = error;
  }

  return highest;
}
