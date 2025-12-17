# DevLog 101: The "Living Journal" Architecture

**Project:** Tasky  
**Date:** Dec 17, 2025  
**Topic:** Why we killed the static To-Do List.

---

### The Problem: The "Wall of Shame"
Every traditional to-do app has the same fatal flaw. You create a list called "Work". You add 5 tasks on Monday. You finish 3. 
Tuesday comes around... and you're staring at Monday's leftovers. 
Wednesday comes... now it's a mix of Monday, Tuesday, and new stuff.

By Friday, your "Work" list isn't a tool anymore; it's a **Wall of Shame**. It’s cluttered, stale, and overwhelming. You stop opening the app because it feels like work just to *look* at it.

### The Insight: Humans Operate in Days
We don't live in one continuous, infinite stream of time. We live in **Days**. 
We sleep, we reset, we wake up. We want a fresh start.
But standard databases don't think like that. They think "Record #543 updated at 10:00 AM."

We wanted to build something that feels **Human**.

### The Solution: The "Living Journal" Model
We didn't just want a "Clear Completed" button. We wanted a fundamental shift in how the app handles time.

We engineered a system we call the **Living Journal**.

#### 1. Identity vs. Instance
In Tasky, "Work" isn't a single file. It's a **Book** (Volume).
When I click "Work" on Tuesday, I shouldn't see Monday's mess *unless I ask for it*.

We built a backend architecture where:
*   **The Identity (Group ID)** is the "Book Title". This is persistent. If I rename my "Work" journal to "Empire Building", it updates *everywhere*, past and present. The Identity is eternal.
*   **The Instance (Sheet ID)** is the "Daily Page". This is unique.

#### 2. The "Virtual Rollover" (The Magic Trick)
Here is the coolest part of the engineering. 
We didn't want to spam the database with empty rows every time a user merely *glanced* at their list. But we also didn't want users to have to manually click "Create New Day".

So we built a **Virtual Rollover** system.

When you open Tasky in the morning:
1.  The app checks the date of your last entry. Last entry was Yesterday?
2.  **POOF.** The app instantly renders a **Fresh, Clean Slate** for Today in the UI.
    *   It *looks* real.
    *   It has Today's date.
    *   It acts like a new page.
3.  **But it doesn't exist yet.** It's a "Virtual Sheet". We haven't touched the database.
4.  The moment—and I mean the *millisecond*—you type your first character to start your day, we silently fire a `realizeSheet()` function in the background.
5.  This function spins up a new database row, links it to your "Identity" group, and saves your work.

**Result:** The user feels zero friction. They just get a fresh start, automatically, every single day. No button clicks. No database clutter.

#### 3. Distinct Vibes
We realized that Monday feels different than Tuesday.
Monday might be High Energy (Red). Tuesday might be Chill (Blue). 
In the old model, changing the color changed it for the *whole file*.
In our **Living Journal**, colors are ephemeral. You can color-code **Today** based on Today's mood, without ruining the aesthetic history of Yesterday.

### Why This Matters
We aren't just building a "Task Manager". We are building a tool that **forgives you**.
It lets you start fresh every sunup. It acknowledges that yesterday is history, and today is a new opportunity.

That is the **Tasky Experience**.

---
*Follow the journey.* 🚀
