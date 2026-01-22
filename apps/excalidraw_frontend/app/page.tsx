import getToken from "@/components/getToken";
import HomePage from "@/components/HomePage";

export default async function Home() {
    const token = await getToken();

    return (
        <HomePage token={token} />
    )

}