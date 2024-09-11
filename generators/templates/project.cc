#include "<%= project_name %>/<%= project_name %>.h"
#include <sstream>

namespace <%= namespace %> {
  auto GetVersion() -> std::string {
    std::stringstream ss;
    ss << <%= prefix %>_VERSION_MAJOR << ".";
    ss << <%= prefix %>_VERSION_MINOR << ".";
    ss << <%= prefix %>_VERSION_PATCH;
    return ss.str();
  }
}