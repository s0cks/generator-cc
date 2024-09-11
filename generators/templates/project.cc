#include "<%= main_header_path %>"
#include <sstream>

namespace <%= namespace %> {
  auto GetVersion() -> std::string {
    std::stringstream ss;
    ss << <%= header_prefix %>_VERSION_MAJOR << ".";
    ss << <%= header_prefix %>_VERSION_MINOR << ".";
    ss << <%= header_prefix %>_VERSION_PATCH;
    return ss.str();
  }
}