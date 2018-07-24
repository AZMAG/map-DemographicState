$(function () {

    let $sidebar = $('#sidebar');
    let $sidebarCollapse = $('#sidebarCollapse');

    $('.sidebarCollapse').on('click', function () {
        $sidebar.toggleClass('active');
        $sidebarCollapse.toggleClass('active');
    });

    let $links = $('.components li');
    let $arrows = $('.arrow-left');
    let $panelDivs = $('.panelDiv');
    let $content = $('#content');
    let $legendToggle = $('.legendToggle');

    let loadedLayers = ["layers"];

    $links.on('click', function (e) {
        let target = $(this).attr('panel-target');
        if (target === 'legend') {
            toggleLegend();
        } else {
            let isActive = $(this).hasClass('active');
            $links.removeClass('active');
            $arrows.hide();
            $panelDivs.hide();

            if (isActive) {
                $content.hide();
            } else {
                $content.show();
                $(this).addClass('active');
                $(this).find('.arrow-left').show();

                if (loadedLayers.indexOf(target) === -1) {
                    $(`div[panel-id="${target}"]`).load(`views/${target}.html`);
                    loadedLayers.push(target);
                }

                $(`div[panel-id=${target}`).fadeIn(400);
            }
        }
    });

    $legendToggle.click(function (e) {
        return false;
    });

    $('#content').on('click', '.closePanel', function () {
        $links.removeClass('active');
        $arrows.hide();
        $panelDivs.hide();
        $content.hide();
    });

    function toggleLegend() {
        if (window.innerWidth < 768) {
            $("#content").hide();
            $(".components li").removeClass("active");
        }
        $('#legend').fadeToggle();
        $legendToggle.prop('checked', !$legendToggle.prop('checked'));
    }
});
