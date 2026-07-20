"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  formatDashboardDate,
  formatDashboardTime,
  formatLocalDate,
  formatLocalTime,
  getLocalGreeting,
} from "@/lib/date-time";
import { db, isConfigured } from "@/lib/supabase/client";

type Client = { id: string };
type Project = {
  id: string;
  name: string;
  client_name?: string;
  status: string;
};
type StudioBooking = {
  id: string;
  title: string;
  booking_date: string;
  start_time?: string;
  space: string;
  status: string;
};
type Transaction = {
  id: string;
  kind: "income" | "expense";
  amount: number | string;
  status: string;
};
type DashboardData = {
  clients: Client[];
  projects: Project[];
  studio: StudioBooking[];
  finance: Transaction[];
  staff: StaffMember[];
};
type StaffMember = { id: string };

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    clients: [],
    projects: [],
    studio: [],
    finance: [],
    staff: [],
  });
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    if (!isConfigured()) return;
    Promise.all([
      db.list("clients", "limit=5&order=created_at.desc"),
      db.list("projects", "limit=5&order=created_at.desc"),
      db.list("studio_bookings", "limit=5&order=booking_date.asc"),
      db.list("transactions", "limit=50&order=created_at.desc"),
      db.list("staff", "order=created_at.asc").catch(() => []),
    ])
      .then(([clients, projects, studio, finance, staff]) =>
        setData({ clients, projects, studio, finance, staff }),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    const updateClock = () => setNow(new Date());

    const initialTimer = window.setTimeout(updateClock, 0);
    const timer = window.setInterval(updateClock, 1_000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, []);

  const income = data.finance
    .filter((item) => item.kind === "income")
    .reduce((total, item) => total + Number(item.amount), 0);
  const pending = data.finance
    .filter((item) => item.status === "pending")
    .reduce((total, item) => total + Number(item.amount), 0);

  return (
    <>
      <section className="dash-hero">
        <small>
          {now
            ? `${formatDashboardDate(now)} · ${formatDashboardTime(now)}`
            : "\u00a0"}
        </small>
        <h1>
          {now ? (
            <>
              {getLocalGreeting(now)}, Akshay<span>.</span>
            </>
          ) : (
            "\u00a0"
          )}
        </h1>
        <p>What are we building today?</p>
        <Link href="/ai">✦ Brief me, Nyla</Link>
      </section>
      <section className="mission-card">
        <div>
          <small>TODAY’S MISSION</small>
          <h2>Move the work that moves the business.</h2>
          <p>
            Keep client promises visible, protect the studio schedule, and turn
            decisions into momentum.
          </p>
        </div>
        <span>
          OPERATING
          <br />
          <b>CALMLY</b>
        </span>
      </section>
      <section className="dash-grid">
        <article className="metric">
          <small>MONTHLY REVENUE</small>
          <strong>₹{income.toLocaleString("en-IN")}</strong>
          <span>Live from finance</span>
        </article>
        <article className="metric">
          <small>PENDING PAYMENTS</small>
          <strong>₹{pending.toLocaleString("en-IN")}</strong>
          <span>Needs follow-up</span>
        </article>
        <article className="metric">
          <small>ACTIVE PROJECTS</small>
          <strong>
            {data.projects.filter((item) => item.status !== "complete")
              .length}
          </strong>
          <span>Across production</span>
        </article>
        <article className="metric">
          <small>CLIENTS</small>
          <strong>{data.clients.length}</strong>
          <span>Recent relationships</span>
        </article>
        <article className="metric">
          <small>STAFF</small>
          <strong>{data.staff.length}</strong>
          <span>Core team members</span>
        </article>
      </section>
      <section className="dash-columns">
        <article className="data-card compact">
          <div className="data-toolbar">
            <div>
              <h2>Project pulse</h2>
              <p>The work closest to delivery</p>
            </div>
            <Link href="/projects">View all →</Link>
          </div>
          {data.projects.length ? (
            data.projects.map((item) => (
              <div className="pulse" key={item.id}>
                <span>◇</span>
                <div>
                  <b>{item.name}</b>
                  <small>{item.client_name || "Independent"}</small>
                </div>
                <em>{item.status}</em>
              </div>
            ))
          ) : (
            <div className="mini-empty">Projects will appear here.</div>
          )}
        </article>
        <article className="data-card compact">
          <div className="data-toolbar">
            <div>
              <h2>Studio schedule</h2>
              <p>Upcoming bookings</p>
            </div>
            <Link href="/studio">View all →</Link>
          </div>
          {data.studio.length ? (
            data.studio.map((item) => (
              <div className="pulse" key={item.id}>
                <span>▣</span>
                <div>
                  <b>{item.title}</b>
                  <small>
                    {formatLocalDate(item.booking_date)}
                    {item.start_time
                      ? ` · ${formatLocalTime(item.start_time)}`
                      : ""}
                    {` · ${item.space}`}
                  </small>
                </div>
                <em>{item.status}</em>
              </div>
            ))
          ) : (
            <div className="mini-empty">Bookings will appear here.</div>
          )}
        </article>
      </section>
    </>
  );
}
