/**
 * CapybaraIcon Component
 *
 * Purpose: Reusable animated capybara icon that can be used anywhere in the app
 * Features: Customizable size, animation toggle, and responsive design
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface CapybaraIconProps {
  size?:
    | "text-xs"
    | "text-sm"
    | "text-md"
    | "text-lg"
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl";
  animated?: boolean;
  showLoader?: boolean;
  className?: string;
}

const BASE_ICON_WIDTH_REM = 12; // Matches the 2XL icon width (w-48)
const BASE_ICON_HEIGHT_REM = 8; // Matches the 2XL icon height (h-44)
const BASE_LOADER_HEIGHT_REM = 1.1; // Loader height (h-4.5 equivalent)
const BASE_LOADER_GAP_REM = 0.02; // Space between icon and loader in 2XL scale

const SIZE_SCALE = {
  "text-xs": 0.08,
  "text-sm": 0.1,
  "text-md": 0.125,
  "text-lg": 0.16,
  xs: 0.22,
  sm: 0.35,
  md: 0.5,
  lg: 0.7,
  xl: 0.85,
  "2xl": 1,
} as const;

type CapybaraIconSize = keyof typeof SIZE_SCALE;

const getScaledDimensions = (size: CapybaraIconSize, showLoader: boolean) => {
  const scale = SIZE_SCALE[size];
  const width = BASE_ICON_WIDTH_REM * scale;
  const iconHeight = BASE_ICON_HEIGHT_REM * scale;
  const loaderHeight = showLoader ? BASE_LOADER_HEIGHT_REM * scale : 0;
  const loaderGap = showLoader ? BASE_LOADER_GAP_REM * scale : 0;

  return {
    scale,
    width,
    iconHeight,
    loaderHeight,
    loaderGap,
    totalHeight: iconHeight + loaderGap + loaderHeight,
  };
};

// Capybara color palettes - fixed colors that don't change with app theme
const capybaraColors = {
  light: {
    primary: "#D9C1A5", // Light tan/beige
    secondary: "#673903", // Dark brown
    accent: "#C86F07", // Orange/amber
    dark: "#010101", // Black
    lightbrown: "#9F715D", // Brown loader color
  },
  dark: {
    primary: "#B8956D", // Main capybara body color (from image)
    secondary: "#3D2914", // Dark brown for shadows/details
    accent: "#8B6914", // Medium brown for accents
    dark: "#2A1810", // Darkest brown for features
    lightbrown: "#7D5C4E", // Brown loader color
  },
};

// Get capybara colors based on current theme
const getCapybaraColors = (theme: string | undefined) => {
  if (theme?.includes("capybara")) {
    return theme.includes("light") ? capybaraColors.light : capybaraColors.dark;
  }
  // Default to light capybara colors for non-capybara themes
  return capybaraColors.light;
};

export function CapybaraIcon({
  size = "2xl",
  animated = true,
  showLoader = false,
  className = "",
}: CapybaraIconProps) {
  const { theme } = useTheme();
  const colors = getCapybaraColors(theme);
  const { scale, width, iconHeight, loaderHeight, loaderGap, totalHeight } =
    getScaledDimensions(size, showLoader);

  const rootStyle = {
    width: `${width}rem`,
    height: `${totalHeight}rem`,
    "--color": colors.primary,
    "--color2": colors.secondary,
    "--color3": colors.accent,
    "--color4": colors.dark,
    "--color5": colors.lightbrown,
    "--capybara-animation-state": animated ? "running" : "paused",
  } as React.CSSProperties;

  const iconWrapperStyle: React.CSSProperties = {
    width: `${BASE_ICON_WIDTH_REM}rem`,
    height: `${BASE_ICON_HEIGHT_REM}rem`,
    transform: `scale(${scale})`,
    transformOrigin: "bottom left",
  };

  const loaderWrapperStyle: React.CSSProperties = {
    width: `${BASE_ICON_WIDTH_REM}rem`,
    height: `${BASE_LOADER_HEIGHT_REM}rem`,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
  };

  return (
    <div
      className={cn("relative z-[1] flex-shrink-0", className)}
      style={rootStyle}
      data-capybara-animated={animated ? "true" : "false"}
    >
      <div
        className="relative"
        style={{ width: `${width}rem`, height: `${iconHeight}rem` }}
      >
        <div className="absolute left-0 bottom-0" style={iconWrapperStyle}>
          <div className={cn("capybara w-full h-full relative z-[1]")}>
            <div className="capyhead w-[7.5em] h-[7em] bottom-0 right-[0.5em] absolute bg-[var(--color)] z-[3] rounded-[3.5em] shadow-[-1em_0_var(--color2)] animate-movebody">
              <div className="capyear w-8 h-8 bg-gradient-to-br from-[var(--color)] to-[var(--color2)] top-0 left-0 rounded-full absolute overflow-hidden z-[3]">
                <div className="capyear2 w-full h-4 bg-[var(--color2)] bottom-0 left-2 rounded-full absolute rotate-[-45deg]"></div>
              </div>
              <div className="capyear w-8 h-8 bg-gradient-to-br from-[var(--color)] via-[var(--color)] to-[var(--color2)] top-0 left-20 rounded-full absolute overflow-hidden z-[3]">
                <div className="capyear2 w-full h-4 bg-[var(--color2)] bottom-0 left-2 rounded-full absolute rotate-[-45deg]"></div>
              </div>
              {/* SVG Face */}
              <div className="absolute bottom-[-2em] left-[-2em] w-[11.5em] h-[11em]">
                <svg
                  viewBox="0 0 1487 1487"
                  className="w-full h-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="var(--color2)"
                    stroke="var(--color2)"
                    strokeWidth="1"
                    opacity="0.99"
                    d="M 697.5 670 L 730.5 670 L 753.5 674 L 775.5 681 Q 810.1 694.9 832 721.5 Q 847.1 739.9 855 765.5 L 859 782.5 L 860 797.5 L 861 798.5 L 861 827.5 L 860 828.5 L 860 837.5 L 856 859.5 L 848 883.5 Q 836.5 910.5 816.5 929 Q 796.9 947.9 768.5 958 L 744.5 964 L 726.5 965 L 725.5 966 L 713.5 966 L 712.5 965 L 698.5 965 L 697.5 964 L 685.5 963 L 652.5 953 Q 623.7 941.3 604 920.5 Q 587.6 903.4 579 878.5 L 573 849.5 L 572 817.5 L 573 816.5 L 573 806.5 L 577 783.5 L 587 753.5 Q 601.4 721.4 626.5 700 Q 640.8 687.8 659.5 680 L 673.5 675 L 697.5 670 Z M 701 688 L 684 691 L 667 697 Q 649 704 637 716 Q 618 732 607 756 L 597 782 L 592 807 L 594 839 L 599 861 Q 604 879 615 892 Q 629 908 651 917 L 676 924 L 695 926 L 696 927 L 710 927 L 711 928 L 737 927 L 758 923 Q 781 915 798 901 Q 817 883 829 857 L 833 846 L 834 835 L 837 823 L 837 817 L 838 816 L 838 807 L 839 806 L 839 792 L 838 791 L 837 772 Q 830 746 814 730 Q 794 707 763 696 L 732 689 L 701 688 Z "
                  />
                  <path
                    fill="var(--color2)"
                    stroke="var(--color2)"
                    strokeWidth="1"
                    opacity="0.99"
                    d="M 517.5 727 L 528.5 727 L 556 733.5 Q 549.3 736.8 537.5 735 L 536.5 734 L 527.5 734 L 510 731 Q 508.9 728.3 511.5 729 L 517.5 727 Z "
                  />
                  <path
                    fill="var(--color2)"
                    stroke="var(--color2)"
                    strokeWidth="1"
                    opacity="0.99"
                    d="M 649.5 729 Q 663.6 728.9 668 738.5 Q 674.6 745.9 674 760.5 L 670.5 765 L 664.5 765 L 646 750.5 Q 641 746.5 642 736.5 L 645.5 731 L 649.5 729 Z "
                  />
                  <path
                    fill="var(--color2)"
                    stroke="var(--color2)"
                    strokeWidth="1"
                    opacity="0.99"
                    d="M 769.5 732 Q 778.6 732.4 782 738.5 L 783 745.5 Q 779.8 754.8 772.5 760 L 761.5 767 L 754.5 768 L 752 767 L 751 764.5 L 751 752.5 Q 754.4 741.4 762.5 735 L 769.5 732 Z "
                  />
                  <path
                    fill="var(--color2)"
                    stroke="var(--color2)"
                    strokeWidth="1"
                    opacity="0.99"
                    d="M 937.5 747 L 951 747.5 L 929.5 757 L 882.5 772 L 883.5 770 L 912.5 755 L 937.5 747 Z "
                  />
                  <path
                    fill="var(--color2)"
                    stroke="var(--color2)"
                    strokeWidth="1"
                    opacity="0.99"
                    d="M 424.5 752 L 499.5 752 L 500.5 753 L 514.5 753 L 515.5 754 L 526.5 754 L 527.5 755 L 542.5 756 L 557.5 759 L 564 762.5 Q 563.4 775.4 557.5 783 L 551.5 781 L 532.5 780 L 531.5 779 L 474.5 779 L 473.5 780 L 452.5 780 L 451.5 781 L 421.5 782 L 420.5 783 L 402.5 784 L 392 786 L 391 783.5 L 391 769.5 L 392 768.5 L 392 755 L 394.5 754 L 423.5 753 L 424.5 752 Z "
                  />
                  <path
                    fill="var(--color2)"
                    stroke="var(--color2)"
                    strokeWidth="1"
                    opacity="0.99"
                    d="M 891 779 L 940.5 779 L 941.5 780 L 970.5 781 L 971.5 782 L 990.5 783 L 998.5 785 L 1019.5 787 L 1071 796 L 1074 806.5 L 1074 822.5 L 1072.5 825 L 1025.5 814 L 1020.5 814 L 995.5 809 L 989.5 809 L 988.5 808 L 973.5 807 L 972.5 806 L 952.5 805 L 951.5 804 L 936.5 804 L 935.5 803 L 886 803 L 891 779 Z "
                  />
                  <path
                    fill="var(--color2)"
                    stroke="var(--color2)"
                    strokeWidth="1"
                    opacity="0.99"
                    d="M 710.5 788 Q 718.6 787.9 721 793.5 L 722 805.5 L 721 806.5 L 721 868.5 L 729.5 878 L 738.5 882 L 744.5 882 Q 754.6 879.6 760 872.5 L 768.5 857 Q 771.1 853.6 778.5 855 L 783 858.5 L 785 865.5 Q 780.4 880.9 769.5 890 Q 762.3 896.8 751.5 900 L 735.5 901 L 725.5 898 L 711.5 888 Q 704.7 896.2 693.5 900 L 684.5 902 L 676.5 902 Q 656 897.5 646 882.5 L 640 871.5 L 639 862.5 L 642.5 858 L 649.5 856 L 657 861.5 Q 660.8 872.8 669.5 879 Q 674.7 883.8 686.5 882 Q 695.2 879.2 700 872.5 L 702 862.5 L 702 796.5 L 707.5 789 L 710.5 788 Z "
                  />
                  <path
                    fill="var(--color5)"
                    stroke="var(--color5)"
                    strokeWidth="1"
                    opacity="0.5"
                    d="M 700.5 688 L 731.5 689 L 762.5 696 Q 793.8 707.2 814 729.5 Q 829.6 746.4 837 771.5 L 838 790.5 L 839 791.5 L 839 805.5 L 838 806.5 L 838 815.5 L 837 816.5 L 837 822.5 L 834 834.5 L 833 845.5 L 829 856.5 Q 817.3 882.8 797.5 901 Q 780.8 915.3 757.5 923 L 736.5 927 L 710.5 928 L 709.5 927 L 695.5 927 L 694.5 926 L 675.5 924 L 650.5 917 Q 628.5 908.5 615 891.5 Q 604.4 878.6 599 860.5 L 594 838.5 L 592 806.5 L 597 781.5 L 607 755.5 Q 618.3 732.3 636.5 716 Q 649.4 704.4 666.5 697 L 683.5 691 L 700.5 688 Z M 650 729 L 646 731 L 642 737 Q 641 746 646 751 L 665 765 L 671 765 L 674 761 Q 675 746 668 739 Q 664 729 650 729 Z M 770 732 L 763 735 Q 754 741 751 753 L 751 765 L 752 767 L 755 768 L 762 767 L 773 760 Q 780 755 783 746 L 782 739 Q 779 732 770 732 Z M 711 788 L 708 789 L 702 797 L 702 863 L 700 873 Q 695 879 687 882 Q 675 884 670 879 Q 661 873 657 862 L 650 856 L 643 858 L 639 863 L 640 872 L 646 883 Q 656 897 677 902 L 685 902 L 694 900 Q 705 896 712 888 L 726 898 L 736 901 L 752 900 Q 762 897 770 890 Q 780 881 785 866 L 783 859 L 779 855 Q 771 854 769 857 L 760 873 Q 755 880 745 882 L 739 882 L 730 878 L 721 869 L 721 807 L 722 806 L 721 794 Q 719 788 711 788 Z "
                  />
                  <path
                    fill="var(--color5)"
                    stroke="var(--color5)"
                    strokeWidth="1"
                    opacity="0.5"
                    d="M 333.5 819 L 347.5 819 L 358.5 822 Q 371.1 827.4 379 837.5 L 385 847.5 L 388 857.5 L 388 865.5 L 389 866.5 L 388 867.5 L 388 875.5 L 385 885.5 L 377 897.5 L 378 898.5 L 378 907.5 L 377 907.5 L 373.5 901 Q 365.7 909.7 352.5 913 L 333.5 914 Q 312.2 909.8 302 894.5 Q 292.7 883.3 293 862.5 L 297 846.5 L 293 834.5 L 295 834 L 299 841 L 302 839.5 L 312.5 828 Q 320.8 821.3 333.5 819 Z "
                  />
                  <path
                    fill="var(--color5)"
                    stroke="var(--color5)"
                    strokeWidth="0.5"
                    opacity="0.5"
                    d="M 1115.5 852 L 1125.5 852 L 1137.5 855 Q 1151 860.5 1159 871.5 L 1167 888.5 L 1168 905.5 L 1166 914.5 L 1160 925.5 L 1160 928.5 L 1161 929.5 L 1162 940.5 L 1160 939.5 L 1155.5 932 Q 1148.9 939.9 1138.5 944 L 1128.5 947 L 1111.5 947 Q 1092.3 942.3 1082 928.5 L 1074 912.5 L 1073 907.5 L 1073 891.5 L 1079 875.5 L 1077 867.5 L 1079 868.5 L 1081.5 872 L 1090.5 862 L 1100.5 856 L 1115.5 852 Z "
                  />
                </svg>
              </div>
            </div>

            <div className="capyleg w-24 h-20 bottom-0 left-0 absolute bg-gradient-to-b from-[var(--color)] to-[var(--color2)] z-[2] rounded-[2em] animate-movebody"></div>

            <div className="capyleg2 w-7 h-12 bottom-0 left-[3.25em] absolute bg-gradient-to-b from-[var(--color)] via-[var(--color)] to-[var(--color2)] z-[2] rounded-[0.75em] shadow-[inset_0_-0.5em_var(--color2)] animate-moveleg"></div>

            <div className="capyleg2 w-5 left-2 h-8 bottom-0 absolute bg-gradient-to-b from-[var(--color)] via-[var(--color)] to-[var(--color2)] z-[2] rounded-[0.75em] shadow-[inset_0_-0.5em_var(--color2)] animate-moveleg2 [animation-delay:0.075s]"></div>

            <div className="capy w-[75%] h-full bg-gradient-to-b from-[var(--color)] via-[var(--color)] to-[var(--color2)] rounded-[45%] relative z-[1] animate-movebody"></div>
          </div>
        </div>
      </div>

      {showLoader && (
        <div
          className="relative"
          style={{
            width: `${width}rem`,
            height: `${loaderHeight}rem`,
            marginTop: `${loaderGap}rem`,
          }}
        >
          <div
            className="loader w-[12rem] h-8 relative z-[1] overflow-hidden"
            style={loaderWrapperStyle}
          >
            <div className="loaderline w-[50em] h-2 border-t-2 border-dashed border-[var(--color2)] animate-moveline"></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CapybaraIcon;
