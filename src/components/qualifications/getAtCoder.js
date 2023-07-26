import axios from "axios"

export async function getAtCoderHighest() {

  try {
    let highest = 0;
    const contests = await axios.get("https://atcoder.jp/users/kyre/history/json");
    console.log(contests.data);
    for (let i = 0; i < contests.data.length; ++i) {
      highest = Math.max(contests.data[i].NewRating, highest);
    }
    console.log(highest);
    return highest;
  }

  catch {
    let highest = "eeee";
    return highest;
  }
}
