"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Skater } from "@/lib/data";
import { TeamLeaders } from "./team-leaders";
import { PlayerLeaders } from "./player-leaders";
import { Distributions } from "./distributions";
import { PlayerFinder } from "./player-finder";

export function Dashboard({ skaters }: { skaters: Skater[] }) {
  return (
    <Tabs defaultValue="team">
      <TabsList>
        <TabsTrigger value="team">Team Leaders</TabsTrigger>
        <TabsTrigger value="player">Player Leaders</TabsTrigger>
        <TabsTrigger value="distributions">Distributions</TabsTrigger>
        <TabsTrigger value="finder">Similar Player Finder</TabsTrigger>
      </TabsList>
      <TabsContent value="team" className="mt-4">
        <TeamLeaders skaters={skaters} />
      </TabsContent>
      <TabsContent value="player" className="mt-4">
        <PlayerLeaders skaters={skaters} />
      </TabsContent>
      <TabsContent value="distributions" className="mt-4">
        <Distributions skaters={skaters} />
      </TabsContent>
      <TabsContent value="finder" className="mt-4">
        <PlayerFinder skaters={skaters} />
      </TabsContent>
    </Tabs>
  );
}
