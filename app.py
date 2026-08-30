import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import streamlit as st
from dotenv import load_dotenv

from common import TABLE_NAME, get_engine

load_dotenv()

st.set_page_config(page_title="NHL Skater Dashboard", layout="wide")

# dataviz skill: sequential hue (blue) for magnitude/leaderboard bars
BLUE = "#2a78d6"
BLUE_DARK = "#184f95"
INK = "#0b0b0b"
MUTED = "#898781"
GRID = "#e1e0d9"


def style_leaderboard_axes(ax):
    ax.spines[["top", "right", "left"]].set_visible(False)
    ax.spines["bottom"].set_color(GRID)
    ax.xaxis.grid(True, color=GRID, linewidth=0.8, zorder=0)
    ax.set_axisbelow(True)
    ax.tick_params(axis="both", colors=MUTED, length=0)
    for label in ax.get_yticklabels():
        label.set_color(INK)


def plot_leaderboard(labels, values, value_fmt="{:.0f}", note=None, height=None):
    n = len(labels)
    fig, ax = plt.subplots(figsize=(7, height or max(2.5, 0.38 * n)))
    y = np.arange(n)
    ax.barh(y, values, color=BLUE, height=0.62, zorder=3)
    ax.set_yticks(y)
    ax.set_yticklabels(labels)
    ax.invert_yaxis()
    xmax = max(values) if len(values) else 1
    ax.set_xlim(0, xmax * 1.15 if xmax > 0 else 1)
    for yi, v in zip(y, values):
        ax.text(v + xmax * 0.02, yi, value_fmt.format(v), va="center", ha="left",
                 color=INK, fontsize=9)
    style_leaderboard_axes(ax)
    if note:
        ax.set_xlabel(note, color=MUTED, fontsize=9)
    fig.tight_layout()
    return fig


def style_plot_axes(ax):
    ax.spines[["top", "right"]].set_visible(False)
    ax.spines[["left", "bottom"]].set_color(GRID)
    ax.grid(True, color=GRID, linewidth=0.8, zorder=0)
    ax.set_axisbelow(True)
    ax.tick_params(axis="both", colors=MUTED, length=0)
    ax.xaxis.label.set_color(INK)
    ax.yaxis.label.set_color(INK)


def plot_histogram(values, xlabel, bins=20):
    fig, ax = plt.subplots(figsize=(6, 4))
    ax.hist(values, bins=bins, color=BLUE, edgecolor="white", linewidth=0.5,
             zorder=3)
    mean_v = np.mean(values)
    ax.axvline(mean_v, color=BLUE_DARK, linestyle="--", linewidth=1.5, zorder=4)
    ax.annotate(f"mean {mean_v:.3f}", (mean_v, ax.get_ylim()[1]),
                textcoords="offset points", xytext=(6, -12), color=BLUE_DARK,
                fontsize=8)
    ax.set_xlabel(xlabel)
    ax.set_ylabel("Number of players")
    style_plot_axes(ax)
    fig.tight_layout()
    return fig


def plot_scatter_single(x, y, xlabel, ylabel):
    fig, ax = plt.subplots(figsize=(6, 4))
    ax.scatter(x, y, color=BLUE, s=24, alpha=0.5, edgecolors="none", zorder=3)
    ax.set_xlabel(xlabel)
    ax.set_ylabel(ylabel)
    style_plot_axes(ax)
    fig.tight_layout()
    return fig


@st.cache_data(ttl=600)
def load_skaters_data() -> pd.DataFrame:
    return pd.read_sql_table(TABLE_NAME, get_engine())


try:
    skaters = load_skaters_data()
except Exception as exc:
    st.title("2025-26 NHL Skater Dashboard")
    st.error(
        "Couldn't reach the Supabase database. Make sure DATABASE_URL is set "
        "(see .env.example) and that upload_data.py has been run at least once."
    )
    st.exception(exc)
    st.stop()

min_gp = 20
qualified = skaters[skaters["games_played"] >= min_gp]

st.title("2025-26 NHL Skater Dashboard")
st.caption("Data served from Supabase Postgres via a Modal-deployed Streamlit app")

st.header("NHL Leaders")
nhl_team_tab, nhl_player_tab = st.tabs(["Team Leaders", "Player Leaders"])

with nhl_team_tab:
    team_totals = skaters.groupby("team").agg(
        goals=("I_F_goals", "sum"), points=("I_F_points", "sum"),
        hits=("I_F_hits", "sum"), pim=("I_F_penalityMinutes", "sum"),
    )

    c1, c2 = st.columns(2)
    with c1:
        st.subheader("Goals")
        d = team_totals["goals"].sort_values(ascending=False)
        st.pyplot(plot_leaderboard(d.index.tolist(), d.values, "{:.0f}"))
    with c2:
        st.subheader("Points")
        d = team_totals["points"].sort_values(ascending=False)
        st.pyplot(plot_leaderboard(d.index.tolist(), d.values, "{:.0f}"))

    c3, c4 = st.columns(2)
    with c3:
        st.subheader("Hits")
        d = team_totals["hits"].sort_values(ascending=False)
        st.pyplot(plot_leaderboard(d.index.tolist(), d.values, "{:.0f}"))
    with c4:
        st.subheader("Penalty Minutes")
        d = team_totals["pim"].sort_values(ascending=False)
        st.pyplot(plot_leaderboard(d.index.tolist(), d.values, "{:.0f}"))

with nhl_player_tab:
    nhl_category = st.selectbox(
        "Leaderboard",
        ["Goals", "Points", "Assists", "Hits", "Penalty Minutes",
         "Faceoffs Won", "Takeaway Differential", "Corsi % (on-ice shot share)"],
    )
    player_totals = skaters.groupby(["playerId", "name"]).agg(
        goals=("I_F_goals", "sum"), points=("I_F_points", "sum"),
        assists=("assists", "sum"), hits=("I_F_hits", "sum"),
        pim=("I_F_penalityMinutes", "sum"), games_played=("games_played", "sum"),
        faceoffs_won=("I_F_faceOffsWon", "sum"),
        takeaways=("I_F_takeaways", "sum"), giveaways=("I_F_giveaways", "sum"),
    ).reset_index()
    player_totals = player_totals[player_totals["games_played"] >= min_gp]
    player_totals["takeaway_diff"] = player_totals["takeaways"] - player_totals["giveaways"]

    stat_map = {
        "Goals": "goals", "Points": "points", "Assists": "assists",
        "Hits": "hits", "Penalty Minutes": "pim", "Faceoffs Won": "faceoffs_won",
        "Takeaway Differential": "takeaway_diff",
    }
    if nhl_category in stat_map:
        d = player_totals.sort_values(stat_map[nhl_category], ascending=False).head(15)
        st.pyplot(plot_leaderboard(d["name"].tolist(), d[stat_map[nhl_category]].values,
                                    "{:.0f}", note=f"Min {min_gp} games played"))
    else:
        weighted = qualified.groupby(["playerId", "name"]).apply(
            lambda g: np.average(g["onIce_corsiPercentage"], weights=g["games_played"]),
            include_groups=False,
        ).rename("corsi")
        gp = qualified.groupby(["playerId", "name"])["games_played"].sum()
        d = pd.concat([weighted, gp], axis=1).sort_values("corsi", ascending=False).head(15)
        labels = [n for _, n in d.index]
        st.pyplot(plot_leaderboard(labels, d["corsi"].values * 100, "{:.1f}%",
                                    note=f"Min {min_gp} games played"))

st.divider()

st.header("Player Distributions")
c5, c6 = st.columns(2)
with c5:
    st.subheader("On-Ice Corsi % Distribution")
    st.caption(f"Qualified skaters (min {min_gp} games played)")
    st.pyplot(plot_histogram(qualified["onIce_corsiPercentage"].values * 100,
                              "On-ice Corsi % (shot-attempt share)"))
with c6:
    st.subheader("Goals vs. Expected Goals")
    st.caption(f"Qualified skaters (min {min_gp} games played)")
    goals_xg = skaters.groupby(["playerId", "name"]).agg(
        goals=("I_F_goals", "sum"), xgoals=("I_F_xGoals", "sum"),
        games_played=("games_played", "sum"),
    )
    goals_xg = goals_xg[goals_xg["games_played"] >= min_gp]
    st.pyplot(plot_scatter_single(goals_xg["xgoals"].values, goals_xg["goals"].values,
                                   "Expected Goals (xG)", "Actual Goals"))
