import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DbAdvertisement } from '../../types';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Eye,
  Tag,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  BarChart2,
  Megaphone,
  Image as ImageIcon,
} from 'lucide-react';
import { AdvertisementManagementModal } from './AdvertisementManagementModal';
import { DynamicAdBillboard } from '../common/DynamicAdBillboard';

export const SponsorsAndAdsView: React.FC = () => {
  const {
    advertisements,
    deleteAdvertisement,
    toggleAdvertisementStatus,
    language,
    setCurrentPortal,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<DbAdvertisement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredAds = advertisements.filter((ad) => {
    const matchesSearch =
      ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ad.category || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || ad.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalClicks = advertisements.reduce((acc, curr) => acc + (curr.clicksCount || 0), 0);
  const activeCount = advertisements.filter((a) => a.status === 'active').length;

  const handleEdit = (ad: DbAdvertisement) => {
    setSelectedAd(ad);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedAd(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (adId: string) => {
    if (
      window.confirm(
        language === 'ta'
          ? 'இந்த விளம்பரத்தை நிச்சயமாக நீக்க விரும்புகிறீர்களா?'
          : 'Are you sure you want to delete this billboard advertisement?'
      )
    ) {
      await deleteAdvertisement(adId);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 p-2.5 flex items-center justify-center shrink-0 shadow-2xs text-amber-700 font-bold">
            <Sparkles className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                Super Admin Billboard
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {language === 'ta'
                ? 'விளம்பரங்கள் & ஸ்பான்சர் மேலாண்மை'
                : 'Super Admin Advertising & Sponsor Management'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'ta'
                ? 'மாணவர் தளத்தில் Welcome Board-க்கு மேலாகத் தோன்றும் விளம்பரப் பலகைகளை உருவாக்கி நிர்வகிக்கவும்.'
                : 'Create and manage official sponsor billboards displayed above the Student Portal Welcome Board.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCreateNew}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer shrink-0 text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ta' ? 'புதிய விளம்பரம் சேர்க்க' : '+ Create New Banner'}</span>
        </button>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Advertisements</div>
          <div className="text-2xl font-black text-slate-900">{advertisements.length}</div>
          <span className="text-[11px] text-slate-400 font-medium">Banners created in system</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Active Live Billboards</div>
          <div className="text-2xl font-black text-emerald-700">{activeCount}</div>
          <span className="text-[11px] text-emerald-800 font-medium">Currently visible to students</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Total Student Clicks</div>
          <div className="text-2xl font-black text-amber-700">{totalClicks}</div>
          <span className="text-[11px] text-amber-800 font-medium">Engagement interactions</span>
        </div>
      </div>

      {/* Live Preview Section */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {language === 'ta'
                ? 'மாணவர் திரையில் விளம்பர பலகை எவ்வாறு தோன்றும் என்பதன் நேரடிக் காட்சி'
                : 'Live Student Portal Billboard Preview'}
            </h3>
          </div>
        </div>

        <DynamicAdBillboard />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              language === 'ta'
                ? 'பிராண்ட் அல்லது தலைப்பு கொண்டு தேடுக...'
                : 'Search brand, title, or category...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Statuses ({advertisements.length})</option>
            <option value="active">Active Only ({activeCount})</option>
            <option value="inactive">Inactive Only ({advertisements.length - activeCount})</option>
          </select>
        </div>
      </div>

      {/* Ads List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredAds.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Sparkles className="w-10 h-10 text-amber-500 mx-auto animate-pulse" />
            <h3 className="text-base font-bold text-slate-800">
              {language === 'ta' ? 'விளம்பரங்கள் எதுவும் கிடைக்கவில்லை' : 'No Billboard Advertisements Found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click the button above to create your first Super Admin advertisement banner.
            </p>
            <button
              type="button"
              onClick={handleCreateNew}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-xs transition cursor-pointer"
            >
              + Create First Banner
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Brand / Banner</th>
                  <th className="p-4">Title & Details</th>
                  <th className="p-4">Promo Code</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Clicks</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAds.map((ad) => (
                  <tr key={ad.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        {ad.imageUrl ? (
                          <img
                            src={ad.imageUrl}
                            alt={ad.brandName}
                            className="w-12 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-10 rounded-lg bg-amber-100 text-amber-800 font-black text-[11px] flex items-center justify-center border border-amber-200 shrink-0">
                            AD
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="block text-slate-900 font-bold">{ad.brandName}</span>
                            {ad.galleryImages && ad.galleryImages.length > 1 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[9px] font-black border border-amber-300 flex items-center gap-0.5">
                                <ImageIcon className="w-2.5 h-2.5 text-amber-600" />
                                <span>{ad.galleryImages.length} P</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-normal">{ad.category || 'Sponsor'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 max-w-md">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-slate-900 block truncate">{ad.title}</span>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{ad.description}</p>
                      </div>
                    </td>

                    <td className="p-4 font-mono font-bold">
                      {ad.promoCode ? (
                        <span className="px-2 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-md text-[11px]">
                          {ad.promoCode} {ad.discountPercentage ? `(${ad.discountPercentage}% OFF)` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal text-[11px]">—</span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          toggleAdvertisementStatus(
                            ad.id,
                            ad.status === 'active' ? 'inactive' : 'active'
                          )
                        }
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold cursor-pointer transition ${
                          ad.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {ad.status === 'active' ? 'Active (Live)' : 'Inactive'}
                      </button>
                    </td>

                    <td className="p-4 text-center font-bold text-slate-900">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg text-slate-800">
                        <BarChart2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>{ad.clicksCount || 0}</span>
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(ad)}
                          className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          title="Edit Advertisement"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(ad.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Delete Advertisement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <AdvertisementManagementModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          adToEdit={selectedAd}
        />
      )}
    </div>
  );
};
