import { useEffect, useState } from 'react';
import {
  DEFAULT_GLOBAL_CONFIG,
  DEFAULT_PORTAL_DECKS,
  DEFAULT_SLIDE1_DATA,
  PORTAL_DOMAIN,
  createNewDeckTemplate,
} from './data/defaultPortal';
import {
  GasAdminResponse,
  GasPublicResponse,
  GlobalConfig,
  KafalahDeckData,
  PortalDeckEntry,
} from './types/presentation';
import { exportKafalahDeckToPptx } from './utils/exportPptx';
import { AdminSubTab, AdminTopBar, PublicTopBar } from './components/TopBar';
import { SlideStage } from './components/SlideStage';
import { AccessLockModal } from './components/AccessLockModal';
import { AdminConsole } from './components/AdminConsole';
import { PrintDeck } from './components/PrintDeck';

function getBasePath(): string {
  const raw = import.meta.env.BASE_URL || '/';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

function isAdminPath(): boolean {
  const base = getBasePath();
  let p = window.location.pathname;
  if (base && p.startsWith(base)) {
    p = p.slice(base.length);
  }
  const cleaned = p.replace(/^\/+|\/+$/g, '').toLowerCase();
  return cleaned === 'admin' || cleaned.startsWith('admin/');
}

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => isAdminPath());
  const [adminSubTab, setAdminSubTab] = useState<AdminSubTab>('slides');

  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>(DEFAULT_GLOBAL_CONFIG);
  const [decks, setDecks] = useState<PortalDeckEntry[]>(DEFAULT_PORTAL_DECKS);
  const [decksData, setDecksData] = useState<Record<string, KafalahDeckData>>({
    '1': DEFAULT_SLIDE1_DATA,
  });

  const [editingSlideId, setEditingSlideId] = useState<string>('1');
  const [pageIndex, setPageIndex] = useState(0);

  const [isPublicLocked, setIsPublicLocked] = useState<boolean>(
    DEFAULT_GLOBAL_CONFIG.public_is_protected
  );
  const [isAdminLocked, setIsAdminLocked] = useState<boolean>(
    DEFAULT_GLOBAL_CONFIG.admin_is_protected
  );
  const [publicLockError, setPublicLockError] = useState<string | null>(null);
  const [adminLockError, setAdminLockError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [gasUrl, setGasUrl] = useState('');
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isLoadingGas, setIsLoadingGas] = useState(false);
  const [gasMessage, setGasMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const activePublicDeck =
    decks.find((d) => d.slide_id === globalConfig.active_slide_id) || decks[0];
  const activePublicData =
    decksData[activePublicDeck.slide_id] || DEFAULT_SLIDE1_DATA;

  const editingDeck =
    decks.find((d) => d.slide_id === editingSlideId) || decks[0];
  const editingData =
    decksData[editingDeck.slide_id] || DEFAULT_SLIDE1_DATA;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    const onPopState = () => {
      setIsAdminRoute(isAdminPath());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateTo = (path: '/' | '/admin') => {
    const base = getBasePath();
    const fullPath = `${base}${path}`;
    window.history.pushState(null, '', fullPath || '/');
    setIsAdminRoute(path === '/admin');
    setPublicLockError(null);
    setAdminLockError(null);
  };

  const handleGlobalConfigChange = (next: GlobalConfig) => {
    const pubOn = !globalConfig.public_is_protected && next.public_is_protected;
    const pubOff = globalConfig.public_is_protected && !next.public_is_protected;
    const admOn = !globalConfig.admin_is_protected && next.admin_is_protected;
    const admOff = globalConfig.admin_is_protected && !next.admin_is_protected;

    setGlobalConfig(next);
    if (pubOn) setIsPublicLocked(true);
    if (pubOff) setIsPublicLocked(false);
    if (admOn) setIsAdminLocked(true);
    if (admOff) setIsAdminLocked(false);
  };

  const handleSetActivePublicSlide = (slideId: string) => {
    setGlobalConfig((prev) => ({ ...prev, active_slide_id: slideId }));
    setPageIndex(0);
    const chosen = decks.find((d) => d.slide_id === slideId);
    showToast(`${chosen?.sheet_name || 'Slide'} diaktifkan untuk halaman publik (/)`);
  };

  const handleAddNewDeck = () => {
    const maxId = decks.reduce((max, d) => {
      const n = parseInt(d.slide_id, 10);
      return !isNaN(n) && n > max ? n : max;
    }, 0);
    const nextId = String(maxId + 1);
    const { portalEntry, deckData } = createNewDeckTemplate(nextId);

    setDecks((prev) => [...prev, portalEntry]);
    setDecksData((prev) => ({ ...prev, [nextId]: deckData }));
    setEditingSlideId(nextId);
    showToast(`File Slide ${nextId} dibuat tanpa mengubah Slide sebelumnya`);
  };

  const handleConnectGas = async (url: string) => {
    if (!url) return;
    setIsLoadingGas(true);
    setGasMessage(null);
    try {
      const sep = url.includes('?') ? '&' : '?';
      const res = await fetch(`${url}${sep}mode=public`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: GasPublicResponse = await res.json();

      if (!json.ok && !json.locked) {
        throw new Error(json.error || 'Respons Google Apps Script tidak valid.');
      }

      setGasUrl(url);
      setIsLiveConnected(true);
      setGlobalConfig((prev) => ({
        ...prev,
        brand_name: json.brand_name || prev.brand_name,
        public_is_protected: Boolean(json.public_is_protected),
        active_slide_id: json.active_deck?.slide_id || prev.active_slide_id,
      }));

      if (json.active_deck) {
        setDecks([json.active_deck]);
        setEditingSlideId(json.active_deck.slide_id);
      }

      if (json.locked) {
        setIsPublicLocked(true);
        setGasMessage({
          type: 'success',
          text: 'Terhubung ke Google Sheets. Halaman publik diproteksi kode akses.',
        });
      } else if (json.data && json.active_deck) {
        setIsPublicLocked(false);
        setDecksData({ [json.active_deck.slide_id]: json.data });
        setGasMessage({
          type: 'success',
          text: `Berhasil memuat slide aktif "${json.active_deck.deck_title}" dari Google Sheets.`,
        });
      }
    } catch (err) {
      setGasMessage({
        type: 'error',
        text:
          (err instanceof Error ? err.message : 'Gagal terhubung ke GAS.') +
          ' Pastikan Web App sudah di-deploy dengan akses "Siapa saja".',
      });
    } finally {
      setIsLoadingGas(false);
    }
  };

  const handleResetDemo = () => {
    setGasUrl('');
    setIsLiveConnected(false);
    setGasMessage(null);
    setGlobalConfig(DEFAULT_GLOBAL_CONFIG);
    setDecks(DEFAULT_PORTAL_DECKS);
    setDecksData({ '1': DEFAULT_SLIDE1_DATA });
    setEditingSlideId('1');
    setIsPublicLocked(DEFAULT_GLOBAL_CONFIG.public_is_protected);
    setIsAdminLocked(DEFAULT_GLOBAL_CONFIG.admin_is_protected);
    setPageIndex(0);
  };

  const handleVerifyPublicCode = async (submittedCode: string) => {
    setPublicLockError(null);
    if (isLiveConnected && gasUrl) {
      setIsVerifying(true);
      try {
        const sep = gasUrl.includes('?') ? '&' : '?';
        const res = await fetch(
          `${gasUrl}${sep}mode=public&code=${encodeURIComponent(submittedCode)}`
        );
        const json: GasPublicResponse = await res.json();
        if (json.locked || !json.ok || !json.data) {
          setPublicLockError(json.error || 'Kode akses presentasi tidak sesuai.');
          return;
        }
        if (json.active_deck) {
          setDecksData((prev) => ({
            ...prev,
            [json.active_deck!.slide_id]: json.data!,
          }));
        }
        setIsPublicLocked(false);
      } catch (err) {
        setPublicLockError(
          err instanceof Error ? err.message : 'Gagal memverifikasi kode akses.'
        );
      } finally {
        setIsVerifying(false);
      }
      return;
    }

    if (submittedCode === globalConfig.public_access_code.trim()) {
      setIsPublicLocked(false);
    } else {
      setPublicLockError('Kode akses presentasi tidak sesuai.');
    }
  };

  const handleVerifyAdminCode = async (submittedCode: string) => {
    setAdminLockError(null);
    if (isLiveConnected && gasUrl) {
      setIsVerifying(true);
      try {
        const sep = gasUrl.includes('?') ? '&' : '?';
        const res = await fetch(
          `${gasUrl}${sep}mode=admin&code=${encodeURIComponent(submittedCode)}`
        );
        const json: GasAdminResponse = await res.json();
        if (json.locked || !json.ok) {
          setAdminLockError(json.error || 'Kode akses Admin tidak sesuai.');
          return;
        }
        if (json.decks && json.decks.length > 0) {
          setDecks(json.decks);
          setEditingSlideId(json.config.active_slide_id || json.decks[0].slide_id);
        }
        if (json.slides_data) {
          setDecksData(json.slides_data);
        }
        setIsAdminLocked(false);
      } catch (err) {
        setAdminLockError(
          err instanceof Error ? err.message : 'Gagal memverifikasi kode akses Admin.'
        );
      } finally {
        setIsVerifying(false);
      }
      return;
    }

    if (submittedCode === globalConfig.admin_access_code.trim()) {
      setIsAdminLocked(false);
    } else {
      setAdminLockError(
        `Kode akses Admin tidak sesuai (contoh default: ${DEFAULT_GLOBAL_CONFIG.admin_access_code}).`
      );
    }
  };

  const handleExportPptx = async () => {
    if (isPublicLocked) return;
    setIsExportingPptx(true);
    try {
      const saved = await exportKafalahDeckToPptx(
        globalConfig.brand_name,
        activePublicDeck,
        activePublicData
      );
      showToast(`Berhasil mengunduh ${saved}`);
    } catch {
      showToast('Gagal mengekspor berkas PPTX.');
    } finally {
      setIsExportingPptx(false);
    }
  };

  const handleExportPdf = () => {
    if (isPublicLocked) return;
    const prevTitle = document.title;
    if (activePublicDeck.export_filename) {
      document.title = activePublicDeck.export_filename.replace(/\.pdf$/i, '');
    }
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 600);
  };

  return (
    <>
      <div className="no-print min-h-screen flex flex-col">
        {isAdminRoute ? (
          <AdminTopBar
            activeSubTab={adminSubTab}
            onSubTabChange={setAdminSubTab}
            onGoPublic={() => navigateTo('/')}
          />
        ) : (
          <PublicTopBar
            brandName={globalConfig.brand_name}
            deckTitle={activePublicDeck.deck_title}
            onExportPptx={handleExportPptx}
            isExporting={isExportingPptx}
            isLocked={isPublicLocked}
          />
        )}

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-7">
          {isAdminRoute ? (
            isAdminLocked ? (
              <AccessLockModal
                title="Akses Halaman Admin"
                subtitle={`${PORTAL_DOMAIN}/admin`}
                description="Masukkan kode akses Admin yang terdaftar di tab Config untuk mengelola slide aktif, data, dan kode akses."
                errorMessage={adminLockError}
                isVerifying={isVerifying}
                onSubmitCode={handleVerifyAdminCode}
                secondaryAction={{
                  label: 'Kembali ke Halaman Publik (/)',
                  onClick: () => navigateTo('/'),
                }}
              />
            ) : (
              <AdminConsole
                subTab={adminSubTab}
                globalConfig={globalConfig}
                onGlobalConfigChange={handleGlobalConfigChange}
                decks={decks}
                editingSlideId={editingSlideId}
                onSelectEditingSlideId={setEditingSlideId}
                onSetActivePublicSlide={handleSetActivePublicSlide}
                onAddNewDeck={handleAddNewDeck}
                editingDeck={editingDeck}
                onDeckMetaChange={(nextDeck) =>
                  setDecks((prev) =>
                    prev.map((d) => (d.slide_id === nextDeck.slide_id ? nextDeck : d))
                  )
                }
                editingData={editingData}
                onDeckDataChange={(nextData) =>
                  setDecksData((prev) => ({
                    ...prev,
                    [editingDeck.slide_id]: nextData,
                  }))
                }
                gasUrl={gasUrl}
                onConnectGas={handleConnectGas}
                onResetDemo={handleResetDemo}
                isLoadingGas={isLoadingGas}
                gasMessage={gasMessage}
                isLiveConnected={isLiveConnected}
                onLockAdmin={
                  globalConfig.admin_is_protected
                    ? () => {
                        setIsAdminLocked(true);
                        setAdminLockError(null);
                      }
                    : undefined
                }
              />
            )
          ) : isPublicLocked ? (
            <AccessLockModal
              title="Presentasi Terproteksi"
              subtitle={globalConfig.brand_name}
              description={`Masukkan kode akses publik untuk membuka presentasi "${activePublicDeck.deck_title}".`}
              errorMessage={publicLockError}
              isVerifying={isVerifying}
              onSubmitCode={handleVerifyPublicCode}
            />
          ) : (
            <SlideStage
              brandName={globalConfig.brand_name}
              deck={activePublicDeck}
              data={activePublicData}
              pageIndex={pageIndex}
              onPageChange={setPageIndex}
              onExportPdf={handleExportPdf}
              onExportPptx={handleExportPptx}
              isExportingPptx={isExportingPptx}
              isProtected={globalConfig.public_is_protected}
              onLockPresentation={
                globalConfig.public_is_protected
                  ? () => {
                      setIsPublicLocked(true);
                      setPublicLockError(null);
                    }
                  : undefined
              }
            />
          )}
        </main>

        <footer className="mx-auto w-full max-w-6xl px-6 py-6 text-xs text-slate-500">
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-5">
            <span>
              {globalConfig.brand_name} · {PORTAL_DOMAIN}
            </span>
            {!isAdminRoute ? (
              <button
                type="button"
                onClick={() => navigateTo('/admin')}
                className="font-medium text-slate-500 hover:text-slate-900 underline-offset-4 hover:underline cursor-pointer"
              >
                Admin
              </button>
            ) : (
              <span>Mode Pengelola · /admin</span>
            )}
          </div>
        </footer>
      </div>

      {toast && (
        <div
          role="status"
          className="no-print fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl"
        >
          {toast}
        </div>
      )}

      {!isAdminRoute && !isPublicLocked && (
        <PrintDeck
          brandName={globalConfig.brand_name}
          deck={activePublicDeck}
          data={activePublicData}
        />
      )}
    </>
  );
}
