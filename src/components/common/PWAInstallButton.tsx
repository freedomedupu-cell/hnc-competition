import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle, Sparkles } from 'lucide-react';

interface PWAInstallButtonProps {
  language?: 'en' | 'ta' | 'si';
  className?: string;
  variant?: 'button' | 'badge' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  language = 'ta',
  className = '',
  variant = 'button',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running in standalone / PWA mode, suppress button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    await install();
    setIsInstalling(false);
  };

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'badge') {
      return (
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          title={language === 'ta' ? 'செயலியை உங்கள் சாதனத்தில் நிறுவவும்' : 'Install App on your device'}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs hover:from-blue-700 hover:to-indigo-700 transition cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5 animate-bounce" />
          <span>{language === 'ta' ? 'செயலி நிறுவு' : 'Install App'}</span>
        </button>
      );
    }

    return (
      <button
        onClick={handleInstallClick}
        disabled={isInstalling}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white shadow-xs hover:from-blue-800 hover:to-indigo-800 transition cursor-pointer border border-blue-500/30 ${className}`}
      >
        <Smartphone className="w-3.5 h-3.5 text-blue-200" />
        <span>{language === 'ta' ? 'செயலியை நிறுவு (Offline Ready)' : 'Install App (Offline Ready)'}</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 border border-slate-700 transition cursor-pointer shadow-xs ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span>{language === 'ta' ? 'iPhone-இல் நிறுவு' : 'Install on iPhone'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {language === 'ta' ? 'iPhone / iPad இல் நிறுவுதல்' : 'Install on iPhone / iPad'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {language === 'ta' ? 'ஆஃப்லைன் பயன்பாட்டிற்கான வழிமுறை' : 'Offline home screen setup'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-xs text-slate-700 space-y-2.5">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                    1
                  </span>
                  <p>
                    {language === 'ta'
                      ? 'Safari உலாவியின் கீழ் உள்ள Share பொத்தானை (Square with Arrow) அழுத்தவும்.'
                      : 'Tap the Share button in Safari toolbar (Square with up arrow).'}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                    2
                  </span>
                  <p>
                    {language === 'ta'
                      ? 'கீழே உருட்டி "Add to Home Screen" (முகப்புத் திரையில் சேர்) என்பதைத் தெரிவு செய்யவும்.'
                      : 'Scroll down and tap "Add to Home Screen".'}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                    3
                  </span>
                  <p>
                    {language === 'ta'
                      ? 'மேல் மூலையிலுள்ள "Add" என்பதை அழுத்தவும். இப்போது இணையம் இல்லாமலும் கற்கலாம்!'
                      : 'Tap "Add" in top corner. You can now access downloaded study materials offline!'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 transition cursor-pointer shadow-xs"
              >
                {language === 'ta' ? 'புரிந்தது' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
