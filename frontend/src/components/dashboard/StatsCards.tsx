import { UserStats } from '@/types';
import { FileText, Activity, AlertTriangle, Calendar } from 'lucide-react';

interface StatsCardsProps {
  stats: UserStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Reports',
      value: stats.totalReports,
      icon: FileText,
      color: 'text-sky-700 dark:text-sky-300',
      bgColor: 'bg-sky-100 dark:bg-sky-900/30',
    },
    {
      title: 'This Month',
      value: stats.reportsThisMonth,
      icon: Calendar,
      color: 'text-emerald-700 dark:text-emerald-300',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      title: 'Abnormal Reports',
      value: stats.abnormalReports,
      icon: AlertTriangle,
      color: 'text-amber-700 dark:text-amber-300',
      bgColor: 'bg-amber-100 dark:bg-amber-900/35',
    },
    {
      title: 'Member Since',
      value: new Date(stats.memberSince).toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      }),
      icon: Activity,
      color: 'text-cyan-700 dark:text-cyan-300',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="glass-panel overflow-hidden rounded-2xl lift-on-hover"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${card.bgColor} rounded-md p-3`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-slate-300 truncate">
                      {card.title}
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                      {card.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
