import { inngest } from "@/lib/inngest/client";
import { createClient } from "@/lib/server";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if(!user) {
        return NextResponse.json(
            { error: "You must be logged in to save preferences." },
            { status: 401 }
        )
    }
    const body = await request.json();
    const { categories, frequency, email } = body;

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
       return NextResponse.json(
         { error: "Categories array is required and must not be empty" },
         { status: 400 }
       );
    }

    if (!frequency || !["daily", "weekly", "biweekly"].includes(frequency)) {
       return NextResponse.json(
         { error: "Valid frequency is required (daily, weekly, biweekly)" },
         { status: 400 }
       );
    }
    const { error: upsertError } = await supabase
        .from("user_preferences")
        .upsert({
            user_id: user.id,
            categories: categories,
            frequency,
            email,
            is_active: true
        }, { onConflict: 'user_id' });

        if (upsertError) {
          console.error("Error saving preferences:", upsertError);
          return NextResponse.json(
            { error: "Failed to save preferences" },
            { status: 500 }
          );
        }

        const {} = await inngest.send({
          name: "newsletter.scheduled",
          data: {
            categories,
            email
          }
        })

        return NextResponse.json({
            success: true,
            message: "Preferences saved and added to table successfully",
            status: 200
        })
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be logged in to view preferences." },
      { status: 401 }
    );
  }

  try {
    const { data: preferences, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching preferences:", error);
      return NextResponse.json(
        { error: "Failed to fetch preferences" },
        { status: 500 }
      );
    }

    if (!preferences) {
      return NextResponse.json(
        { error: "Preferences not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(preferences, { status: 200 });
  } catch (error) {
  console.error("Error fetching preferences:", error);
  return NextResponse.json(
    { error: "Failed to fetch preferences" },
    { status: 500 }
  );
}
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if(!user) {
    return NextResponse.json(
      { error: "You must be logged in to save preferences." },
      { status: 401 }
    );
  }
  try {
    const body = await request.json();
    const { is_active } = body

    const { error: updateError } = await supabase
      .from("user_preferences")
      .update({ is_active })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating preferences:", updateError);
      return NextResponse.json(
        { error: "Failed to update preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: 200
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}