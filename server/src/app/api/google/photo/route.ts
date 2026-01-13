import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const photoReference = searchParams.get('reference');
    const maxWidth = searchParams.get('maxwidth') || '400';

    if (!photoReference) {
        return NextResponse.json({ error: 'Photo reference is required' }, { status: 400 });
    }

    const googlePlacesApi = process.env.NEXT_PUBLIC_GOOGLE_PLACES;

    try {
        const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${googlePlacesApi}`;
        
        const response = await fetch(photoUrl);
        
        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch photo' }, { status: 500 });
        }

        const imageBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        return new NextResponse(imageBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400, s-maxage=604800',
            },
        });
    } catch (error) {
        console.error('Error fetching Google Places photo:', error);
        return NextResponse.json({ error: 'Failed to fetch photo' }, { status: 500 });
    }
}
