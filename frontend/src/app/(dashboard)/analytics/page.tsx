'use client'

import { BarChart3, TrendingUp, Clock, Phone } from 'lucide-react'
import { motion } from 'framer-motion'
import { VoxCard } from '@/components/vox'

export default function AnalyticsPage() {
  // Placeholder data - will be connected to API later
  const stats = [
    { label: 'Total Calls', value: '1,234', icon: Phone, change: '+12%' },
    { label: 'Avg. Duration', value: '3m 42s', icon: Clock, change: '-5%' },
    { label: 'Success Rate', value: '94.2%', icon: TrendingUp, change: '+2.3%' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-readable">Analytics</h1>
        <p className="text-slate-400 mt-1 tracking-readable">
          View call metrics and performance insights
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <VoxCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-white/5">
                    <Icon size={20} className="text-vox-idle" />
                  </div>
                  <span className={`text-sm font-medium ${
                    stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <div className="text-2xl font-bold tracking-readable">{stat.value}</div>
                <div className="text-sm text-slate-400 tracking-readable">{stat.label}</div>
              </VoxCard>
            </motion.div>
          )
        })}
      </div>

      {/* Placeholder Chart Area */}
      <VoxCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 size={24} className="text-vox-idle" />
          <h2 className="text-xl font-semibold tracking-readable">Call Volume</h2>
        </div>
        <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-lg">
          <div className="text-center">
            <BarChart3 size={48} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400 tracking-readable">
              Analytics dashboard coming soon
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Connect to backend API for real-time metrics
            </p>
          </div>
        </div>
      </VoxCard>
    </div>
  )
}
