
/* М'яке диво — Premium 7.0 Compact V2 */
(() => {
  'use strict';

  function init() {
    const grid = document.getElementById('products');
    if (!grid) return;

    const css = document.createElement('style');

    css.textContent = `
      #products article.product .details {
        padding:10px !important;
        gap:4px !important;
        min-height:0 !important;
        justify-content:flex-start !important;
      }

      #products article.product h3 {
        margin:4px 0 !important;
        font-size:18px !important;
        line-height:1.2 !important;
        min-height:0 !important;
        height:auto !important;
      }

      #products article.product .details p {
        margin:3px 0 !important;
        padding:0 !important;
        font-size:12px !important;
        line-height:1.4 !important;
        min-height:0 !important;
        height:auto !important;
        flex:0 0 auto !important;
      }

      #products article.product .tag {
        font-size:11px !important;
        margin:0 !important;
      }

      #products article.product .bottom {
        margin-top:auto !important;
        padding-top:4px !important;
        gap:5px !important;
      }

      #products article.product .price {
        font-size:19px !important;
        margin:2px 0 !important;
      }

      #products article.product .add {
        width:100% !important;
        min-height:38px !important;
        padding:8px !important;
        font-size:13px !important;
        border-radius:12px !important;
      }

      #products .p70-rating {
        font-size:11px !important;
        margin:2px 0 !important;
        padding:0 !important;
      }

      #products .p70-actions {
        display:grid !important;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:5px;
        width:100%;
        margin-top:5px;
      }

      #products .p70-actions button {
        display:flex !important;
        flex-direction:column !important;
        align-items:center !important;
        justify-content:center !important;
        gap:3px !important;
        width:100% !important;
        min-width:0 !important;
        min-height:44px !important;
        height:auto !important;
        padding:5px 2px !important;
        margin:0 !important;
        border:1px solid #ead5dd !important;
        border-radius:10px !important;
        background:#f8ebef !important;
        color:#86566f !important;
        box-shadow:none !important;
        font-size:10px !important;
        line-height:1.1 !important;
      }

      #products .p70-actions svg {
        width:19px;
        height:19px;
        fill:none;
        stroke:currentColor;
        stroke-width:1.8;
        stroke-linecap:round;
        stroke-linejoin:round;
        pointer-events:none;
      }

      #products .p70-actions button::before,
      #products .p70-actions button::after {
        content:none !important;
        display:none !important;
      }

      #products .p70-hide-info {
        display:none !important;
      }

      #products .p50-product-actions:empty {
        display:none !important;
      }

      @media(max-width:600px) {
        #products article.product .details {
          padding:9px !important;
        }

        #products article.product h3 {
          font-size:17px !important;
        }

        #products article.product .picture img {
          height:175px !important;
        }
      }
    `;

    document.head.append(css);

    const icons = {
      review: '<svg viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/></svg>',

      share: '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg>'
    };

    function decorate(button, type, label) {
      if (button.dataset.compactIcon === type) return;

      button.dataset.compactIcon = type;
      button.setAttribute('aria-label', label);
      button.title = label;
      button.innerHTML =
        icons[type] + '<span>' + label + '</span>';
    }

    function compact() {
      grid.querySelectorAll('article.product')
        .forEach(card => {
          const details = card.querySelector('.details');
          if (!details) return;

          const review =
            details.querySelector('.p50-review-btn');

          const share =
            details.querySelector('.p70-share');

          details.querySelectorAll('button,a')
            .forEach(button => {
              if (
                button.dataset.compactIcon === 'info' ||
                /детальніше|детальна інформація/i.test(
                  button.textContent.trim()
                )
              ) {
                button.classList.add('p70-hide-info');
              }
            });

          if (!review || !share) return;

          let row = details.querySelector('.p70-actions');

          if (!row) {
            row = document.createElement('div');
            row.className = 'p70-actions';
            details.append(row);
          }

          decorate(review, 'review', 'Відгуки');
          decorate(share, 'share', 'Поділитися');

          [review, share].forEach((button, index) => {
            if (row.children[index] !== button) {
              row.insertBefore(
                button,
                row.children[index] || null
              );
            }
          });
        });
    }

    let scheduled = false;

    function refresh() {
      if (scheduled) return;
      scheduled = true;

      requestAnimationFrame(() => {
        scheduled = false;
        compact();
      });
    }

    const observer = new MutationObserver(refresh);

    observer.observe(grid, {
      childList:true,
      subtree:true
    });

    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
