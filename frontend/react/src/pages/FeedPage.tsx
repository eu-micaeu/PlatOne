import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import FriendsActivityFeed from '../components/FriendsActivityFeed';

type FeedPageProps = {
  authToken: string | null;
  onNavigateToProfile: (username: string) => void;
};

export default function FeedPage({
  authToken,
  onNavigateToProfile,
}: FeedPageProps) {
  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-panel mb-6 p-6 sm:p-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--text-soft)]">
              <Sparkles size={12} className="text-amber-500" />
              <span>Social Activity</span>
            </div>

            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Feed de Atividades
            </h1>
            <p className="mt-1 text-sm text-[var(--text-soft)]">
              Acompanhe em tempo real as últimas platinas e conquistas desbloqueadas pelos seus amigos.
            </p>
          </div>
        </div>
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <FriendsActivityFeed
          authToken={authToken}
          onNavigateToProfile={onNavigateToProfile}
        />
      </motion.div>
    </>
  );
}
