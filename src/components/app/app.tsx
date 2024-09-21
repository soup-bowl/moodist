import { useState, useMemo, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { BiSolidHeart } from 'react-icons/bi/index';
import { Howler } from 'howler';

import { useSoundStore } from '@/stores/sound';

import { Container } from '@/components/container';
import { StoreConsumer } from '@/components/store-consumer';
import { Buttons } from '@/components/buttons';
import { Categories } from '@/components/categories';
import { SharedModal } from '@/components/modals/shared';
import { Toolbar } from '@/components/toolbar';
import { SnackbarProvider } from '@/contexts/snackbar';

import { sounds } from '@/data/sounds';
import { FADE_OUT } from '@/constants/events';

import type { Sound } from '@/data/types';
import { subscribe } from '@/lib/event';
import { Modal } from '../modal';

import styles from './app.module.css';

export function App() {
  const categories = useMemo(() => sounds.categories, []);

  const favorites = useSoundStore(useShallow(state => state.getFavorites()));
  const pause = useSoundStore(state => state.pause);
  const lock = useSoundStore(state => state.lock);
  const unlock = useSoundStore(state => state.unlock);

  const favoriteSounds = useMemo(() => {
    const favoriteSounds = categories
      .map(category => category.sounds)
      .flat()
      .filter(sound => favorites.includes(sound.id));

    /**
     * Reorder based on the order of favorites
     */
    return favorites.map(favorite =>
      favoriteSounds.find(sound => sound.id === favorite),
    );
  }, [favorites, categories]);

  useEffect(() => {
    const onChange = () => {
      const { ctx } = Howler;

      if (ctx && !document.hidden) {
        setTimeout(() => {
          ctx.resume();
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', onChange, false);

    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe(FADE_OUT, (e: { duration: number }) => {
      lock();

      setTimeout(() => {
        pause();
        unlock();
      }, e.duration);
    });

    return unsubscribe;
  }, [pause, lock, unlock]);

  const allCategories = useMemo(() => {
    const favorites = [];

    if (favoriteSounds.length) {
      favorites.push({
        icon: <BiSolidHeart />,
        id: 'favorites',
        sounds: favoriteSounds as Array<Sound>,
        title: 'Favorites',
      });
    }

    return [...favorites, ...categories];
  }, [favoriteSounds, categories]);

  /**
   * DOMAIN CHANGE MODAL
   */
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!window.location.href.includes('moodist.mvze.net')) setShowModal(true);
  }, []);

  return (
    <>
      <SnackbarProvider>
        <StoreConsumer>
          <Container>
            <div id="app" />
            <Buttons />
            <Categories categories={allCategories} />
          </Container>

          <Toolbar />
          <SharedModal />
        </StoreConsumer>
      </SnackbarProvider>

      <Modal show={showModal} onClose={() => setShowModal(false)}>
        <div className={styles.modal}>
          <h2>Important Update: Moodist Moving to a New Subdomain</h2>

          <p>Dear users of Moodist,</p>
          <p>
            In an effort to reduce costs, I have decided to move Moodist from a
            standalone domain <span>moodist.app</span> to a subdomain{' '}
            <span>moodist.mvze.net</span>. This change should be seamless unless
            you are using certain features that require storing data in the
            browser. The change in the domain will result in the loss of data
            stored in your browser&apos;s local storage. If you have stored data
            in this version of Moodist that you wish to keep (such as notes,
            presets, etc.), please make sure to move it to the{' '}
            <a href="https://moodist.mvze.net" rel="noreferrer" target="_blank">
              new version
            </a>{' '}
            as soon as possible. This version will be redirected to the new
            version of Moodist on September 28th.
          </p>
          <p>
            If you have any questions, requests, or problems in this regard,
            please open an issue on{' '}
            <a
              href="https://github.com/remvze/moodist"
              rel="noreferrer"
              target="_blank"
            >
              GitHub
            </a>{' '}
            or mention me on{' '}
            <a href="https://x.com/remvze" rel="noreferrer" target="_blank">
              X (Twitter)
            </a>
            . I will be more than happy to assist you.
          </p>
          <p>Thank you for using Moodist!</p>
        </div>
      </Modal>
    </>
  );
}
