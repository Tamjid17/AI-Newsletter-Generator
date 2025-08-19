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
    
    // Fetch current active status for the user
    const { data: existingPreferences } = await supabase
      .from("user_preferences")
      .select("is_active")
      .eq("user_id", user.id)
      .single();

    const isActiveStatus = existingPreferences?.is_active ?? true;

    const { error: upsertError } = await supabase
      .from("user_preferences")
      .upsert({
        user_id: user.id,
        categories: categories,
        frequency,
        email,
        is_active: isActiveStatus
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
            email,
            frequency,
            userId: user.id,
          },
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

    if (!is_active) {
      console.log(
        `User ${user.id} paused their newsletter. Future jobs will be skipped.`
      );
    } else {
      await rescheduleUserNewsletter(user.id);
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

async function rescheduleUserNewsletter(userId: string) {
  const supabase = await createClient();

  try {
    const { data: preferences, error } = await supabase
      .from("user_preferences")
      .select("categories, frequency, email")
      .eq("user_id", userId)
      .single();

    if (error || !preferences) {
      throw new Error(`User preferences not found for userId: ${userId}`);
    }

    const now = new Date();
    let nextScheduleTime: Date;
    switch (preferences.frequency) {
      case "daily":
        nextScheduleTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case "weekly":
        nextScheduleTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case "biweekly":
        nextScheduleTime = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        break;
      default:
        nextScheduleTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    nextScheduleTime.setHours(9, 0, 0, 0);

    await inngest.send({
      name: "newsletter.scheduled",
      data: {
        userId: userId,
        email: preferences.email,
        categories: preferences.categories,
        frequency: preferences.frequency,
      },
      ts: nextScheduleTime.getTime(),
    });

    console.log(
      `Rescheduled newsletter for user ${userId} at ${nextScheduleTime.toISOString()}`
    );
  } catch (error) {
    console.error("Error in rescheduleUserNewsletter:", error);
  }
}