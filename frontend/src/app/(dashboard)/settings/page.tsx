'use client'

import { Settings, User, Bell, Shield, Palette } from 'lucide-react'
import { motion } from 'framer-motion'
import { VoxCard, VoxButton, VoxInput } from '@/components/vox'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-readable">Settings</h1>
        <p className="text-slate-400 mt-1 tracking-readable">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <VoxCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <User size={24} className="text-vox-idle" />
              <h2 className="text-xl font-semibold tracking-readable">Profile</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2 tracking-readable">
                  Email
                </label>
                <VoxInput
                  type="email"
                  defaultValue="user@example.com"
                  disabled
                  className="opacity-60"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2 tracking-readable">
                  Display Name
                </label>
                <VoxInput
                  type="text"
                  placeholder="Enter your name"
                />
              </div>
              <VoxButton variant="primary" className="mt-2">
                Save Changes
              </VoxButton>
            </div>
          </VoxCard>
        </motion.div>

        {/* Quick Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <VoxCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings size={24} className="text-vox-idle" />
              <h2 className="text-xl font-semibold tracking-readable">Quick Settings</h2>
            </div>
            <div className="space-y-4">
              {[
                { icon: Bell, label: 'Notifications', desc: 'Email & push alerts' },
                { icon: Shield, label: 'Security', desc: '2FA & sessions' },
                { icon: Palette, label: 'Appearance', desc: 'Theme & display' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
                  >
                    <Icon size={18} className="text-vox-idle" />
                    <div>
                      <div className="text-sm font-medium tracking-readable">{item.label}</div>
                      <div className="text-xs text-slate-500">{item.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </VoxCard>
        </motion.div>
      </div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <VoxCard className="p-6 border-red-500/20">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={24} className="text-red-400" />
            <h2 className="text-xl font-semibold tracking-readable text-red-400">
              Danger Zone
            </h2>
          </div>
          <p className="text-sm text-slate-400 mb-4 tracking-readable">
            Irreversible actions for your account
          </p>
          <VoxButton variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
            Delete Account
          </VoxButton>
        </VoxCard>
      </motion.div>
    </div>
  )
}
