import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'wouter';
import {
  Palette,
  Download,
  Trash2,
  Copy,
  X,
  Image as ImageIcon,
  LoaderCircle,
  AlertCircle,
  Send,
  ChevronDown,
  Check,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';
import { useImageGenStore, type GeneratedImage } from '../store/imageGenStore';
import { useSettingsStore } from '../store/settingsStore';
import { useAppStore } from '../store/appStore';
import { generateImage, getImageGenProviders, COMMON_IMAGE_MODELS } from '../services/imageGen';
import { GlassButton } from '../components/ui/GlassButton';
import { PortalDropdown } from '../components/ui/PortalDropdown';

export default function ImageGenPage() {
  const {
    images,
    isGenerating,
    progress,
    selectedProvider,
    selectedModel,
    customProvider,
    addImage,
    removeImage,
    setGenerating,
    setProgress,
    setSelectedProvider,
    setSelectedModel,
    clearAll,
  } = useImageGenStore();

  const providers = useSettingsStore((s) => s.providers);
  const setSettingsModalOpen = useAppStore((s) => s.setSettingsModalOpen);
  const setSettingsInitialTab = useAppStore((s) => s.setSettingsInitialTab);
  const setActiveFeature = useAppStore((s) => s.setActiveFeature);
  const setPendingChatImage = useAppStore((s) => s.setPendingChatImage);
  const [, navigate] = useLocation();

  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1024x1024');
  const [quality, setQuality] = useState('standard');
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<GeneratedImage | null>(null);

  // Dropdown state
  const [providerOpen, setProviderOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const providerTriggerRef = useRef<HTMLButtonElement>(null);
  const modelTriggerRef = useRef<HTMLButtonElement>(null);
  const sizeTriggerRef = useRef<HTMLButtonElement>(null);

  const imageGenProviders = getImageGenProviders();

  const availableProviders = useMemo(() => {
    return Object.entries(imageGenProviders)
      .filter(([id, config]) => {
        if (config.isCustom) return true; // Custom always available
        const provider = providers.find((p) => p.id === id);
        return provider?.enabled && provider?.apiKey;
      })
      .map(([id, config]) => ({ id, ...config }));
  }, [providers, imageGenProviders]);

  const currentProvider = imageGenProviders[selectedProvider];
  const hasProvider = selectedProvider === 'custom'
    ? !!customProvider.baseUrl
    : availableProviders.some((p) => p.id === selectedProvider);

  const currentModels = useMemo(() => {
    if (selectedProvider === 'custom') {
      return customProvider.modelName ? [customProvider.modelName] : COMMON_IMAGE_MODELS;
    }
    return currentProvider?.models || [];
  }, [selectedProvider, currentProvider, customProvider.modelName]);

  const sizes = ['512x512', '768x768', '1024x1024', '1024x1792', '1792x1024'];

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    const provider = selectedProvider === 'custom' ? null : providers.find((p) => p.id === selectedProvider);
    if (selectedProvider !== 'custom' && !provider?.apiKey) return;

    setGenerating(true);
    setProgress('Starting...');
    setError('');

    try {
      const apiKey = selectedProvider === 'custom' ? customProvider.apiKey : (provider?.apiKey || '');
      const model = selectedModel || currentModels[0] || '';

      const result = await generateImage(
        prompt.trim(),
        selectedProvider,
        apiKey,
        model,
        { size, quality },
        selectedProvider === 'custom' ? customProvider.baseUrl : undefined,
        setProgress,
      );

      const newImage: GeneratedImage = {
        id: crypto.randomUUID(),
        prompt: prompt.trim(),
        imageData: result.imageData,
        mimeType: result.mimeType,
        provider: selectedProvider,
        model,
        settings: { size, quality },
        createdAt: Date.now(),
      };

      addImage(newImage);
      setPrompt('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGenerating(false);
      setProgress('');
    }
  };

  const handleDownload = (img: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = `data:${img.mimeType};base64,${img.imageData}`;
    link.download = `chpio-${img.id.slice(0, 8)}.png`;
    link.click();
  };

  const handleCopyPrompt = (img: GeneratedImage) => {
    navigator.clipboard.writeText(img.prompt);
    setCopiedId(img.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendToChat = (img: GeneratedImage) => {
    setPendingChatImage({ base64: img.imageData, mimeType: img.mimeType });
    setActiveFeature('chat');
    navigate('/chat');
  };

  const closeFullscreen = useCallback(() => setFullscreenImage(null), []);

  useEffect(() => {
    if (!fullscreenImage) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeFullscreen(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fullscreenImage, closeFullscreen]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-teal-400" />
          <h1 className="text-sm font-medium text-white">Image Generation</h1>
        </div>

        {/* Provider status */}
        {availableProviders.length === 0 && selectedProvider !== 'custom' ? (
          <div className="rounded-lg bg-amber-400/10 border border-amber-400/20 p-3 mb-3">
            <p className="text-xs text-amber-400/70">
              No image generation providers configured. Enable OpenAI, Together AI, or Pollinations AI in Settings.
            </p>
            <button
              onClick={() => {
                setSettingsInitialTab('imagegen');
                setSettingsModalOpen(true);
              }}
              className="mt-2 text-xs text-teal-400 hover:underline cursor-pointer"
            >
              Open Settings
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-3">
            {/* Provider dropdown */}
            <div className="relative">
              <button
                ref={providerTriggerRef}
                onClick={() => setProviderOpen(!providerOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-white/10 transition-colors cursor-pointer min-w-[120px]"
              >
                <span className="truncate">{currentProvider?.name || 'Select Provider'}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition-transform ${providerOpen ? 'rotate-180' : ''}`} />
              </button>
              <PortalDropdown
                isOpen={providerOpen}
                triggerRef={providerTriggerRef}
                align="left"
                direction="down"
                onClose={() => setProviderOpen(false)}
                className="w-48 bg-[#1A201F] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
              >
                <div className="p-1">
                  {availableProviders.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedProvider(p.id);
                        setSelectedModel('');
                        setProviderOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        selectedProvider === p.id
                          ? 'bg-teal-400/15 text-teal-400'
                          : 'text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span>{p.name}</span>
                      {selectedProvider === p.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </PortalDropdown>
            </div>

            {/* Model dropdown */}
            {currentModels.length > 0 && (
              <div className="relative flex-1">
                <button
                  ref={modelTriggerRef}
                  onClick={() => setModelOpen(!modelOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-white/10 transition-colors cursor-pointer w-full"
                >
                  <span className="truncate flex-1 text-left">{selectedModel || currentModels[0] || 'Select Model'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition-transform ${modelOpen ? 'rotate-180' : ''}`} />
                </button>
                <PortalDropdown
                  isOpen={modelOpen}
                  triggerRef={modelTriggerRef}
                  align="left"
                  direction="down"
                  matchTriggerWidth
                  onClose={() => setModelOpen(false)}
                  className="bg-[#1A201F] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                >
                  <div className="p-1 max-h-48 overflow-y-auto">
                    {currentModels.map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          setSelectedModel(m);
                          setModelOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                          (selectedModel || currentModels[0]) === m
                            ? 'bg-teal-400/15 text-teal-400'
                            : 'text-white/50 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span className="truncate">{m}</span>
                        {(selectedModel || currentModels[0]) === m && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </PortalDropdown>
              </div>
            )}
          </div>
        )}

        {/* Prompt input */}
        <div className="flex gap-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
            placeholder="Describe the image you want to generate..."
            rows={2}
            className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80 outline-none resize-none placeholder-white/20 focus:border-teal-400/30 transition-colors"
            disabled={isGenerating}
          />
          <GlassButton
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating || !hasProvider}
            variant="accent"
            className="self-end"
          >
            {isGenerating ? (
              <LoaderCircle className="w-4 h-4 animate-spin" />
            ) : (
              <Palette className="w-4 h-4" />
            )}
          </GlassButton>
        </div>

        {/* Settings row */}
        <div className="flex items-center gap-2 mt-2">
          {/* Size dropdown */}
          <div className="relative">
            <button
              ref={sizeTriggerRef}
              onClick={() => setSizeOpen(!sizeOpen)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/50 hover:bg-white/10 transition-colors cursor-pointer"
            >
              {size}
              <ChevronDown className="w-3 h-3" />
            </button>
            <PortalDropdown
              isOpen={sizeOpen}
              triggerRef={sizeTriggerRef}
              align="left"
              direction="down"
              onClose={() => setSizeOpen(false)}
              className="bg-[#1A201F] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="p-1">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSize(s); setSizeOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[10px] transition-colors cursor-pointer ${
                      size === s
                        ? 'bg-teal-400/15 text-teal-400'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {s}
                    {size === s && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </PortalDropdown>
          </div>

          {/* Quality */}
          <button
            onClick={() => setQuality(quality === 'standard' ? 'hd' : 'standard')}
            className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/50 hover:bg-white/10 transition-colors cursor-pointer"
          >
            {quality === 'standard' ? 'Standard' : 'HD'}
          </button>
        </div>

        {/* Progress / Error */}
        {isGenerating && progress && (
          <p className="text-[10px] text-teal-400/60 mt-2">{progress}</p>
        )}
        {error && (
          <div className="flex items-center gap-2 mt-2 px-2 py-1.5 rounded-lg bg-red-400/10 border border-red-400/20">
            <AlertCircle className="w-3 h-3 text-red-400/60 shrink-0" />
            <span className="text-[10px] text-red-400/70 truncate flex-1">{error}</span>
            <button onClick={() => setError('')} className="text-red-400/40 hover:text-red-400/70 cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Image grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/20">
            <ImageIcon className="w-12 h-12 mb-4" />
            <p className="text-sm">No images yet</p>
            <p className="text-xs mt-1">Type a prompt above to generate your first image</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {images.map((img) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-xl overflow-hidden bg-white/5 border border-white/10"
                >
                  <div className="aspect-square overflow-hidden relative group">
                    <img
                      src={`data:${img.mimeType};base64,${img.imageData}`}
                      alt={img.prompt}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setFullscreenImage(img)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="View fullscreen"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-2 space-y-1.5">
                    <p className="text-[10px] text-white/40 line-clamp-2">{img.prompt}</p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownload(img)}
                        className="p-1 rounded text-white/30 hover:text-teal-400 hover:bg-teal-400/10 transition-colors cursor-pointer"
                        title="Download"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleCopyPrompt(img)}
                        className="p-1 rounded text-white/30 hover:text-teal-400 hover:bg-teal-400/10 transition-colors cursor-pointer"
                        title="Copy prompt"
                      >
                        <AnimatePresence mode="wait">
                          {copiedId === img.id ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.5, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                            >
                              <CheckCircle2 className="w-3 h-3 text-teal-400" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="copy"
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.5, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                            >
                              <Copy className="w-3 h-3" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                      <button
                        onClick={() => handleSendToChat(img)}
                        className="p-1 rounded text-white/30 hover:text-teal-400 hover:bg-teal-400/10 transition-colors cursor-pointer"
                        title="Send to chat"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                      <div className="flex-1" />
                      <AnimatePresence mode="wait">
                        {deletingId === img.id ? (
                          <motion.div
                            key="confirm"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-1"
                          >
                            <button
                              onClick={() => { removeImage(img.id); setDeletingId(null); }}
                              className="p-1 rounded text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                              title="Confirm delete"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="p-1 rounded text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </motion.div>
                        ) : (
                          <motion.button
                            key="delete"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.15 }}
                            onClick={() => setDeletingId(img.id)}
                            className="p-1 rounded text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      {images.length > 0 && (
        <div className="p-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] text-white/20">{images.length} image{images.length !== 1 ? 's' : ''}</span>
          <button
            onClick={clearAll}
            className="text-[10px] text-red-400/40 hover:text-red-400 transition-colors cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Fullscreen overlay */}
      {fullscreenImage && createPortal(
        <AnimatePresence>
          <motion.div
            key="fullscreen-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center"
            onClick={closeFullscreen}
          >
            <motion.img
              key="fullscreen-image"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              src={`data:${fullscreenImage.mimeType};base64,${fullscreenImage.imageData}`}
              alt={fullscreenImage.prompt}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[60vw]">
              <p className="text-xs text-white/50 text-center truncate">{fullscreenImage.prompt}</p>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
