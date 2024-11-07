import { NextRequest, NextResponse } from "next/server"
import { animeApi } from "@/config/site"
import { redis } from "@/lib/redis"
import { CACHE_MAX_AGE } from "@/lib/constant"
import { META } from "@consumet/extensions"

export async function GET(
  req: NextRequest,
  { params }: { params: { animeId: string } }
) {
  const animeId = params.animeId
  const searchParams = req.nextUrl.searchParams
  const provider = searchParams.get("provider") || "gogoanime"
  const dub = searchParams.get("dub") || false
  const anilist = new META.Anilist()

  try {
    if (!animeId)
      return NextResponse.json("Missing animeId for /anime/info", {
        status: 422,
      })

    const cachedResponse = await redis.get(`episodes:${animeId}`)

    if (cachedResponse) {
      return NextResponse.json(cachedResponse)
    }

    const data = await anilist.fetchEpisodesListById(animeId, dub as boolean)

    const stringifyResult = JSON.stringify(data)

    await redis.setex(`episodes:${animeId}`, 60 * 60 * 84 + 84, stringifyResult)

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json("Something went Wrong", { status: 500 })
  }
}
