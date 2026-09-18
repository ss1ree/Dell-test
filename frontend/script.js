document.addEventListener('DOMContentLoaded', () => {
    const ctaButtons = document.querySelectorAll('.cta-link');

    ctaButtons.forEach(button => {
    button.addEventListener('click', function (e) {
        const ctaName = this.getAttribute('data-cta') || 'unknown_cta';
        const targetHref = this.getAttribute('href');

        // 1. Отправляем в Google Tag Manager dataLayer
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
        'event': 'cta_button_click',
        'cta_name': ctaName,
        'target_url': targetHref,
        'brand': 'Dell'
        });

        // 2. Отправляем событие напрямую в GA4
        if (typeof gtag === 'function') {
        gtag('event', 'cta_click', {
            'event_category': 'CTA',
            'event_label': ctaName,
            'value': 1
        });
        }

        console.log(`[Analytics] CTA Click tracked: ${ctaName}`);
    });
    });
});